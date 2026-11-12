import express from 'express';
import { provisionInitialSuperadmin } from './initial-superadmin.js';

const ROLES = new Set(['admin', 'superadmin']);
const STATUSES = new Set(['active', 'blocked']);
const hasPrivateAccess = user => ['fabricAccess', 'fabricInvitationAccess'].some(key => Object.hasOwn(user.private_metadata || {}, key));
const storedAccess = user => Object.hasOwn(user.private_metadata || {}, 'fabricAccess') ? user.private_metadata.fabricAccess
  : Object.hasOwn(user.private_metadata || {}, 'fabricInvitationAccess') ? user.private_metadata.fabricInvitationAccess
    : user.public_metadata?.fabricAccess;
const primaryEmail = user => user.email_addresses?.find(address => address.id === user.primary_email_address_id);

export function userAccess(user) {
  // Invitation metadata is written by the Backend API and copied by Clerk on acceptance.
  // Private overrides take precedence, including blocks; unsafe_metadata is never trusted.
  const access = storedAccess(user);
  if (!access || typeof access.email !== 'string') return null;
  const verifiedEmail = user.email_addresses?.some(e =>
    e.verification?.status === 'verified' && e.email_address.toLowerCase() === access.email.toLowerCase());
  if (!access || !ROLES.has(access.role) || !verifiedEmail || user.banned) return null;
  return { ...access, status: access.status === 'active' ? 'active' : 'blocked' };
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

  async function activateInvitation(user) {
    // An explicit admin decision (even null/invalid) must never be replaced by an old invitation.
    if (user.banned || hasPrivateAccess(user)) return user;
    if (user.public_metadata?.fabricAccess && user.public_metadata.fabricAccess.status !== 'active') return user;
    let access = userAccess(user);
    let invitationId = null;
    if (access?.status !== 'active') {
      // Recover accepted platform invitations when Clerk has not copied their metadata.
      // Check provider records, never client tickets, token email claims, or pending invitations.
      if (!Number.isFinite(user.created_at) || user.created_at <= 0) return user;
      const emails = [...new Set((user.email_addresses || []).filter(address => address.verification?.status === 'verified')
        .map(address => address.email_address.toLowerCase()))];
      search: for (const email of emails) {
        for (let offset = 0; offset < 500; offset += 100) {
          const result = await provider.listAcceptedInvitations(email, 100, offset);
          const invitations = Array.isArray(result) ? result : result.data;
          if (!Array.isArray(invitations)) throw new Error('Invalid invitation response');
          const invitation = invitations.find(item => {
            const grant = item.public_metadata?.fabricAccess;
            return item.status === 'accepted' && item.revoked !== true && /^inv_[\w-]+$/.test(item.id) &&
              item.email_address?.toLowerCase() === email && typeof grant?.email === 'string' && grant.email.toLowerCase() === email &&
              grant.status === 'active' && ROLES.has(grant.role) && /^user_[\w-]+$/.test(grant.grantedBy) &&
              Number.isFinite(item.created_at) && item.created_at > 0 && Number.isFinite(item.updated_at) &&
              // A deleted user's old invitation must not authorize a later account with the same email.
              item.created_at <= user.created_at && user.created_at <= item.updated_at;
          });
          if (invitation) { access = invitation.public_metadata.fabricAccess; invitationId = invitation.id; break search; }
          if (invitations.length < 100) break;
        }
      }
    }
    if (!access || access.status !== 'active') return user;
    // Use a separate key: a concurrent manual block/change remains authoritative even
    // if it happens after this read and before Clerk merges the invitation grant.
    await provider.setInvitationAccess(user.id, { email: access.email.toLowerCase(), role: access.role, status: 'active',
      grantedBy: access.grantedBy, source: 'invitation', invitationId, updatedAt: new Date().toISOString() });
    const current = await provider.getUser(user.id);
    if (!Object.hasOwn(current.private_metadata || {}, 'fabricInvitationAccess')) throw new Error('Invitation access was not persisted');
    audit({ action: 'access.invitation_activated', actor: user.id, target: user.id, role: access.role, invitationId });
    return current;
  }

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
        user = await activateInvitation(user);
      }
      const access = userAccess(user);
      if (!access || access.status !== 'active') {
        return fail(res, 403, 'ACCESS_DENIED', user.banned ? 'Esta cuenta está suspendida. Contacta al superadministrador.'
          : storedAccess(user)?.status === 'blocked' ? 'El superadministrador retiró tu acceso. Solo puede restablecerlo desde la consola.'
            : 'Esta cuenta no tiene acceso activo. Completa tu invitación con el correo que la recibió o contacta al superadministrador.');
      }
      req.identity = { claims, user, access };
      next();
    } catch (error) {
      if (error?.status === 404) return fail(res, 401, 'INVALID_SESSION', 'La cuenta o la sesión ya no está disponible. Inicia sesión de nuevo.');
      return fail(res, 503, 'IDENTITY_UNAVAILABLE', 'No se pudo verificar tu acceso. Intenta de nuevo.');
    }
  }

  router.get('/auth/login', identify, (req, res) => {
    const { user, access } = req.identity;
    res.json({ success: true, userId: user.id, status: 'activo', rol: access.role,
      mfaRequired: false });
  });

  router.use('/access', identify, (req, res, next) => {
    if (req.identity.access.role !== 'superadmin') return fail(res, 403, 'SUPERADMIN_REQUIRED', 'Solo el superadministrador puede gestionar accesos.');
    next();
  });

  const handle = fn => async (req, res) => {
    try { await fn(req, res); }
    catch (error) { fail(res, error.status || 503, 'ACCESS_OPERATION_FAILED', error.status === 409
      ? 'Revisa las invitaciones pendientes. Si ese correo ya tiene una cuenta, búscala en Usuarios y usa Gestionar acceso.'
      : 'No se pudo completar la operación. Intenta de nuevo.'); }
  };

  router.get('/access/users', handle(async (req, res) => {
    const offset = Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0));
    const query = typeof req.query.query === 'string' ? req.query.query.trim().slice(0, 254) : '';
    const [result, count] = await Promise.all([provider.listUsers(25, offset, query), provider.countUsers(query)]);
    const users = Array.isArray(result) ? result : result.data;
    // Repair already-accepted accounts in the directory too, without a second approval.
    // Limit concurrent provider requests while reconciling one page of users.
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(4, users.length) }, async () => {
      while (cursor < users.length) { const index = cursor++; users[index] = await activateInvitation(users[index]); }
    }));
    res.json({ users: users.map(user => {
      const primary = primaryEmail(user);
      const assigned = storedAccess(user);
      const effective = userAccess(user);
      const role = ROLES.has(assigned?.role) ? assigned.role : null;
      const email = primary?.email_address || '';
      const emailVerified = Boolean(email && primary.verification?.status === 'verified');
      return {
        id: user.id, name: [user.first_name, user.last_name].filter(Boolean).join(' '), email,
        role, status: user.banned || (role && assigned.status !== 'active') ? 'blocked' : effective?.status || 'unauthorized',
        emailVerified, canGrantAccess: emailVerified && !user.banned,
        accessSource: assigned?.source === 'invitation' ? 'invitation' : role ? 'manual' : null,
        authorizedEmail: role && typeof assigned.email === 'string' ? assigned.email : '',
        accessIssue: user.banned ? 'banned' : !email ? 'email_missing' : !emailVerified ? 'email_unverified'
          : role && assigned.status === 'active' && !effective ? 'email_changed' : null,
      };
    }), total: count.total_count, offset });
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
      public_metadata: { fabricAccess: { email, role, status: 'active', source: 'invitation', grantedBy: req.identity.user.id } },
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
    if (target.id !== req.params.id) return fail(res, 404, 'USER_NOT_FOUND', 'La cuenta ya no está disponible. Actualiza la lista.');
    const primary = primaryEmail(target);
    let email = primary?.email_address?.toLowerCase() || '';
    if (status === 'active') {
      if (target.banned) return fail(res, 409, 'ACCOUNT_BANNED', 'Esta cuenta está suspendida en el proveedor de identidad. Contacta al responsable del sistema.');
      if (!email || primary.verification?.status !== 'verified') return fail(res, 400, 'EMAIL_NOT_VERIFIED', 'La persona debe añadir y verificar su correo principal antes de recibir acceso. Puede usar Gmail, Outlook o un correo corporativo.');
      const confirmedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (confirmedEmail !== email) return fail(res, 409, 'EMAIL_CHANGED', 'El correo de esta cuenta cambió. Cierra esta ventana y actualiza la lista antes de autorizarla.');
    } else {
      // Blocking must also work after the approved address is removed or becomes unverified.
      const approvedEmail = storedAccess(target)?.email;
      if (typeof approvedEmail === 'string') email = approvedEmail;
    }
    await provider.setAccess(target.id, { email, role, status, grantedBy: req.identity.user.id, updatedAt: new Date().toISOString() });
    // Every private request reads current permissions; already-issued JWTs cannot bypass a block/demotion.
    audit({ action: 'access.updated', actor: req.identity.user.id, target: target.id, role, status });
    res.json({ success: true });
  }));

  router.delete('/access/users/:id', handle(async (req, res) => {
    const id = req.params.id;
    if (!/^user_[\w-]+$/.test(id)) return fail(res, 400, 'INVALID_INPUT', 'Usuario inválido.');
    if (id === req.identity.user.id) return fail(res, 409, 'SELF_DELETE_FORBIDDEN', 'No puedes eliminar tu propia cuenta desde la consola.');
    const target = await provider.getUser(id);
    if (target.id !== id || target.id === req.identity.user.id) return fail(res, 404, 'USER_NOT_FOUND', 'La cuenta ya no está disponible. Actualiza la lista.');
    const email = target.email_addresses?.find(address => address.id === target.primary_email_address_id)?.email_address;
    const expected = email || target.id;
    const confirmation = typeof req.body?.confirmation === 'string' ? req.body.confirmation.trim() : '';
    const matches = email ? confirmation.toLowerCase() === expected.toLowerCase() : confirmation === expected;
    if (!confirmation || !matches) return fail(res, 400, 'DELETE_CONFIRMATION_REQUIRED', 'Escribe el correo actual de la cuenta (o su identificador si no tiene correo) para confirmar su eliminación.');
    const deleted = await provider.deleteUser(id);
    if (deleted?.deleted !== true || deleted.id !== id) throw new Error('No se pudo confirmar la eliminación.');
    audit({ action: 'access.deleted', actor: req.identity.user.id, target: id });
    res.json({ success: true, deletedUserId: id });
  }));

  function protect(req, res, next) {
    if (isPublicOperation(req)) return next();
    return identify(req, res, () => {
      if (req.path.toLowerCase().replace(/\/+$/, '') === '/api/admin/clear-db' && req.identity.access.role !== 'superadmin') {
        return fail(res, 403, 'SUPERADMIN_REQUIRED', 'Solo el superadministrador puede vaciar la base de datos.');
      }
      next();
    });
  }
  return { router, protect };
}
