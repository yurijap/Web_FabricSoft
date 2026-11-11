import express from 'express';
import { provisionInitialSuperadmin } from './initial-superadmin.js';

export const MFA_MAX_AGE_MINUTES = 15;
const ROLES = new Set(['admin', 'superadmin']);
const STATUSES = new Set(['active', 'blocked']);

export function userAccess(user) {
  // Invitation metadata is written by the Backend API and copied by Clerk on acceptance.
  // Private overrides take precedence, including blocks; unsafe_metadata is never trusted.
  const access = user.private_metadata?.fabricAccess ?? user.public_metadata?.fabricAccess;
  if (!access || typeof access.email !== 'string') return null;
  const verifiedEmail = user.email_addresses?.some(e =>
    e.verification?.status === 'verified' && e.email_address.toLowerCase() === access.email.toLowerCase());
  if (!access || !ROLES.has(access.role) || !verifiedEmail || user.banned) return null;
  return { ...access, status: access.status === 'active' ? 'active' : 'blocked' };
}

export function hasRecentMfa(user, claims) {
  const age = claims.fva?.[1];
  return user.totp_enabled === true && Number.isFinite(age) && age >= 0 && age < MFA_MAX_AGE_MINUTES;
}

// Explicit public operations. All other backend operations, including legacy aliases,
// require an authorized admin. Adding an endpoint does not silently make it public.
const PUBLIC = new Set([
  'GET /api/health', 'GET /api/waitlist-quarters', 'GET /api/referencias',
  'GET /api/office-hours/disponibilidad/mes', 'GET /api/office-hours/disponibilidad/dia',
  'GET /api/office-hours/room-info', 'GET /api/office-hours/verify-pin',
  'POST /api/leads/referencia', 'POST /api/leads/solicitar', 'POST /api/leads/waitlist',
  'POST /api/leads', 'POST /api/papers/solicitar', 'POST /api/papers/request',
  'POST /api/papers/download', 'POST /api/papers/access',
  'POST /api/doctrina/solicitar', 'POST /api/doctrina/request',
  'POST /api/cloud-cost/solicitar', 'POST /api/cloud-cost',
  'POST /api/referencias/solicitar', 'POST /api/nda/solicitar',
  'POST /api/office-hours/solicitar', 'GET /api/office-hours/slots',
  'POST /api/erp-modernization/lead', 'POST /api/erp-modernization/submit',
  'POST /api/erp-modernization/booking-confirmation',
  'POST /api/rescue-assessment/submit', 'POST /rescue-assessment/submit',
  'POST /api/rescue-assessment', 'POST /api/fusion-rescue', 'POST /api/fusion-rescue/submit',
  'POST /api/fusion-rescue/track', 'POST /api/rescue-assessment/track',
  // Existing guest meeting transport uses its separate room/PIN flow.
  'POST /api/room/sync', 'POST /api/room/signal', 'GET /api/room/signal',
  'POST /api/room/message', 'POST /api/room/transcript', 'POST /api/room/leave',
]);
export function isPublicOperation(req) {
  const pathname = req.path.replace(/\/+$/, '') || '/';
  return PUBLIC.has(`${req.method === 'HEAD' ? 'GET' : req.method} ${pathname}`);
}

function fail(res, status, code, error) {
  return res.status(status).json({ success: false, code, error });
}

export function createAccessControl({ provider, authorizedParties, appOrigin, audit = () => {} }) {
  const router = express.Router();

  async function identify(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (!provider || !authorizedParties.length) {
      return fail(res, 503, 'AUTH_NOT_CONFIGURED', 'El acceso administrativo no está configurado. Contacta al responsable del sistema.');
    }
    const token = /^Bearer (\S+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token) return fail(res, 401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    let claims;
    try {
      claims = await provider.verifyToken(token, authorizedParties);
    } catch (error) {
      // Log only a known diagnostic category. Clerk error messages can include
      // token contents or instance details and must not be logged or returned.
      const originRejected = error?.reason === 'token-invalid-authorized-parties';
      audit({ action: 'access.session_rejected', reason: originRejected ? 'origin-not-allowed' : 'invalid-session' });
      if (originRejected) {
        return fail(res, 401, 'AUTH_ORIGIN_NOT_ALLOWED', 'Este dominio no está autorizado para iniciar sesión. Revisa APP_ORIGIN y CLERK_AUTHORIZED_PARTIES en Vercel.');
      }
      return fail(res, 401, 'INVALID_SESSION', 'La sesión es inválida o ha expirado.');
    }
    if (!claims.sub || !claims.sid || !authorizedParties.includes(claims.azp) || claims.act) {
      return fail(res, 401, 'INVALID_SESSION', 'La sesión no está autorizada para esta aplicación.');
    }
    try {
      let [user, session] = await Promise.all([provider.getUser(claims.sub), provider.getSession(claims.sid)]);
      if (session.status !== 'active' || session.user_id !== claims.sub || !Number.isFinite(session.expire_at) || session.expire_at <= Date.now()) {
        return fail(res, 401, 'INVALID_SESSION', 'La sesión ya no está activa.');
      }
      if (req.method === 'GET' && req.baseUrl === '/api' && req.path === '/auth/login') {
        user = await provisionInitialSuperadmin(user, provider, audit);
      }
      const access = userAccess(user);
      if (!access || access.status !== 'active') {
        return fail(res, 403, 'ACCESS_DENIED', 'Tu cuenta no tiene acceso autorizado. Solicita una invitación al superadministrador.');
      }
      req.identity = { claims, user, access, mfaVerified: hasRecentMfa(user, claims) };
      next();
    } catch {
      return fail(res, 503, 'IDENTITY_UNAVAILABLE', 'No se pudo verificar tu acceso. Intenta de nuevo.');
    }
  }

  function enforceMfa(req, res, next) {
    if (req.identity.access.role === 'superadmin' && !req.identity.mfaVerified) {
      return fail(res, 403, req.identity.user.totp_enabled ? 'MFA_REQUIRED' : 'MFA_ENROLLMENT_REQUIRED',
        'El superadministrador debe verificar su segundo factor para continuar.');
    }
    next();
  }

  router.get('/auth/login', identify, (req, res) => {
    const { user, access, mfaVerified } = req.identity;
    res.json({ success: true, userId: user.id, status: 'activo', rol: access.role,
      mfaRequired: access.role === 'superadmin', mfaEnrolled: user.totp_enabled === true, mfaVerified });
  });

  router.use('/access', identify, enforceMfa, (req, res, next) => {
    if (req.identity.access.role !== 'superadmin') return fail(res, 403, 'SUPERADMIN_REQUIRED', 'Solo el superadministrador puede gestionar accesos.');
    next();
  });

  const handle = fn => async (req, res) => {
    try { await fn(req, res); }
    catch (error) { fail(res, error.status || 503, 'ACCESS_OPERATION_FAILED', error.status === 409
      ? 'La invitación ya existe o el proveedor rechazó esos datos. Revisa el correo y las invitaciones pendientes.'
      : 'No se pudo completar la operación. Intenta de nuevo.'); }
  };

  router.get('/access/users', handle(async (req, res) => {
    const offset = Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0));
    const [result, count] = await Promise.all([provider.listUsers(25, offset), provider.countUsers()]);
    const users = Array.isArray(result) ? result : result.data;
    res.json({ users: users.map(user => ({
      id: user.id, name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      email: user.email_addresses?.find(e => e.id === user.primary_email_address_id)?.email_address || '',
      role: userAccess(user)?.role || null, status: userAccess(user)?.status || 'unauthorized',
      mfaEnrolled: user.totp_enabled === true,
    })), total: count.total_count, offset });
  }));

  router.get('/access/invitations', handle(async (req, res) => {
    const offset = Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0));
    const result = await provider.listInvitations(25, offset);
    const invitations = Array.isArray(result) ? result : result.data;
    res.json({ invitations: invitations.filter(i => i.public_metadata?.fabricAccess).map(i => ({
      id: i.id, email: i.email_address, role: i.public_metadata.fabricAccess.role,
      status: i.status, createdAt: i.created_at,
    })), hasMore: invitations.length === 25, offset });
  }));

  router.post('/access/invitations', handle(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body?.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !ROLES.has(role)) {
      return fail(res, 400, 'INVALID_INPUT', 'Indica un correo válido y un rol permitido.');
    }
    if (!appOrigin || !authorizedParties.includes(appOrigin)) return fail(res, 503, 'AUTH_NOT_CONFIGURED', 'Falta configurar la dirección de la plataforma.');
    const invitation = await provider.invite({ email_address: email, redirect_url: `${appOrigin}/crear-cuenta`,
      public_metadata: { fabricAccess: { email, role, status: 'active', grantedBy: req.identity.user.id } },
      notify: true, expires_in_days: 7 });
    audit({ action: 'access.invited', actor: req.identity.user.id, target: invitation.id, role });
    res.status(201).json({ success: true });
  }));

  router.post('/access/invitations/:id/revoke', handle(async (req, res) => {
    if (!/^inv_[\w-]+$/.test(req.params.id)) return fail(res, 400, 'INVALID_INPUT', 'Invitación inválida.');
    await provider.revokeInvitation(req.params.id);
    audit({ action: 'access.invitation_revoked', actor: req.identity.user.id, target: req.params.id });
    res.json({ success: true });
  }));

  router.patch('/access/users/:id', handle(async (req, res) => {
    const { role, status } = req.body || {};
    if (!/^user_[\w-]+$/.test(req.params.id) || !ROLES.has(role) || !STATUSES.has(status)) {
      return fail(res, 400, 'INVALID_INPUT', 'Usuario, rol o estado inválido.');
    }
    // No self-demotion/self-blocking: there is always a controlling superadmin.
    if (req.params.id === req.identity.user.id) return fail(res, 409, 'SELF_CHANGE_FORBIDDEN', 'No puedes modificar tu propio acceso.');
    const target = await provider.getUser(req.params.id);
    const email = target.email_addresses?.find(e => e.id === target.primary_email_address_id && e.verification?.status === 'verified')?.email_address?.toLowerCase();
    if (!email) return fail(res, 400, 'EMAIL_NOT_VERIFIED', 'El usuario debe verificar su correo antes de recibir acceso.');
    await provider.setAccess(target.id, { email, role, status, grantedBy: req.identity.user.id, updatedAt: new Date().toISOString() });
    // Every private request reads current permissions; already-issued JWTs cannot bypass a block/demotion.
    audit({ action: 'access.updated', actor: req.identity.user.id, target: target.id, role, status });
    res.json({ success: true });
  }));

  function protect(req, res, next) {
    if (isPublicOperation(req)) return next();
    return identify(req, res, () => enforceMfa(req, res, () => {
      if (req.path.toLowerCase().replace(/\/+$/, '') === '/api/admin/clear-db' && req.identity.access.role !== 'superadmin') {
        return fail(res, 403, 'SUPERADMIN_REQUIRED', 'Solo el superadministrador puede vaciar la base de datos.');
      }
      next();
    }));
  }
  return { router, protect };
}
