import { userAccess } from '../../server/access.js';

const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const primaryEmail = user => user.email_addresses?.find(address => address.id === user.primary_email_address_id);
const alreadyApplied = (user, account) => user.private_metadata?.fabricDeploymentProvisioning?.migration === account.migration;

export class ProductionSetupError extends Error {}

function checkTarget(user, email) {
  const primary = primaryEmail(user);
  if (!/^user_[\w-]+$/.test(user.id || '') || normalize(primary?.email_address) !== email || primary?.verification?.status !== 'verified') {
    throw new ProductionSetupError('La cuenta de Julio debe tener ese correo como principal y verificado. No se modificó otra cuenta.');
  }
  if (user.banned || user.locked) throw new ProductionSetupError('La cuenta de Julio está suspendida o bloqueada en Clerk. Revisa su estado antes de provisionarla.');
}

// Called only by the production build. There is deliberately no bootstrap HTTP route.
export async function provisionSuperadmin({ provider, ledger, account, clock = () => new Date() }) {
  const claim = await ledger.claim();
  if (!claim) return { status: 'already-applied' };
  try {
    const loadUser = async id => {
      const user = await provider.getUser(id);
      if (user?.id !== id) throw new ProductionSetupError('Clerk devolvió una cuenta distinta de la solicitada. El alta se detuvo.');
      return user;
    };
    const finish = async user => {
      const receipt = user.private_metadata?.fabricDeploymentProvisioning;
      if (!alreadyApplied(user, account)) throw new ProductionSetupError('Clerk no confirmó los metadatos del alta de Julio.');
      if (receipt.status === 'completed') {
        await ledger.complete(claim, { userId: user.id, outcome: 'already-applied' });
        return { status: 'already-applied', userId: user.id };
      }
      checkTarget(user, account.email);
      const permission = userAccess(user);
      const manualDecision = user.private_metadata?.fabricAccess?.grantedBy !== account.migration;
      if (user.password_enabled !== true || (!manualDecision && (permission?.role !== 'superadmin' || permission.status !== 'active'))) {
        throw new ProductionSetupError('Clerk no confirmó la contraseña y los permisos de Julio. El alta no se marcó como completada.');
      }
      // Updating this separate receipt must not overwrite later role/password changes.
      await provider.setProvisioningReceipt(user.id, { ...receipt, status: 'completed' });
      const confirmed = await loadUser(user.id);
      if (!alreadyApplied(confirmed, account) || confirmed.private_metadata.fabricDeploymentProvisioning.status !== 'completed') {
        throw new ProductionSetupError('Clerk no confirmó el cierre del alta de Julio.');
      }
      const status = manualDecision ? 'manual-decision-preserved' : 'provisioned';
      await ledger.complete(claim, { userId: user.id, outcome: status });
      return { status, userId: user.id };
    };
    let user;
    if (claim.userId) {
      try { user = await loadUser(claim.userId); }
      catch (error) {
        // A known identity was removed after provisioning started. Never recreate it.
        if (error.status !== 404) throw error;
        await ledger.complete(claim, { userId: claim.userId, outcome: 'account-removed' });
        return { status: 'account-removed' };
      }
    } else {
      const result = await provider.findUsersByEmail(account.email);
      const users = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(users)) throw new ProductionSetupError('No se pudo comprobar la cuenta de Julio en Clerk.');
      const matches = users.filter(item => item.email_addresses?.some(address => normalize(address.email_address) === account.email));
      if (matches.length > 1) throw new ProductionSetupError('Clerk devolvió más de una cuenta para Julio. Revisa las cuentas antes de continuar.');
      user = matches[0];
    }
    if (user && alreadyApplied(user, account)) {
      // Even if a later admin decision removed access or the password changed, do not reset it.
      return await finish(user);
    }
    if (!user && claim.creationStarted) {
      throw new ProductionSetupError('Hay un alta anterior incompleta de Julio. Revisa Clerk antes de reintentar; no se recreará una cuenta eliminada.');
    }
    const appliedAt = clock().toISOString();
    const access = { email: account.email, role: 'superadmin', status: 'active', source: 'deployment',
      grantedBy: account.migration, updatedAt: appliedAt };
    const marker = { migration: account.migration, status: 'pending', appliedAt };
    const password = { password_digest: account.passwordDigest, password_hasher: account.passwordHasher };
    if (user) {
      checkTarget(user, account.email);
      await ledger.record(claim, { userId: user.id });
      // Re-read immediately before the one-time update, preserving unrelated private metadata.
      user = await loadUser(user.id);
      if (alreadyApplied(user, account)) {
        return await finish(user);
      }
      checkTarget(user, account.email);
      await provider.updateUser(user.id, { ...password, sign_out_of_other_sessions: true,
        private_metadata: { ...user.private_metadata, fabricAccess: access, fabricDeploymentProvisioning: marker } });
    } else {
      // Persist the attempt before sending a request whose result could be lost on interruption.
      await ledger.record(claim, { creationStarted: true });
      try {
        user = await provider.createUser({ email_address: [account.email], ...password,
          private_metadata: { fabricAccess: access, fabricDeploymentProvisioning: marker } });
      } catch (error) {
        // An explicit validation/auth rejection did not create an identity; allow retry after fixing configuration.
        if (error.providerStatus >= 400 && error.providerStatus < 500 && error.providerStatus !== 408) {
          await ledger.record(claim, { creationStarted: false });
        }
        throw error;
      }
      if (!/^user_[\w-]+$/.test(user?.id || '')) throw new ProductionSetupError('Clerk no confirmó la creación de la cuenta de Julio.');
      await ledger.record(claim, { userId: user.id });
    }
    return await finish(await loadUser(user.id));
  } catch (error) {
    await ledger.release(claim).catch(() => {});
    throw error;
  }
}

export function isProductionDeployment(env) {
  return env.VERCEL === '1' && env.VERCEL_ENV === 'production' &&
    (!env.VERCEL_TARGET_ENV || env.VERCEL_TARGET_ENV === 'production');
}

export function frontendHost(publishableKey) {
  if (!/^pk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(publishableKey || '')) throw new ProductionSetupError('Falta VITE_CLERK_PUBLISHABLE_KEY válida en el entorno Production de Vercel.');
  const hostname = Buffer.from(publishableKey.replace(/^pk_(test|live)_/, ''), 'base64').toString('utf8').replace(/\$$/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(hostname)) throw new ProductionSetupError('La clave pública de Clerk no contiene un dominio válido.');
  return hostname;
}

export function matchingSigningKeys(backend, frontend) {
  return Array.isArray(backend?.keys) && Array.isArray(frontend?.keys) && backend.keys.some(a =>
    a.kty === 'RSA' && a.n && a.e && frontend.keys.some(b => b.kty === a.kty && b.n === a.n && b.e === a.e));
}
