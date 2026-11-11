// Initial account explicitly authorized by the project owner.
// This module runs only on the server, after Clerk verifies the session.
export const INITIAL_SUPERADMIN_EMAIL = 'edilbertoh369@gmail.com';

export async function provisionInitialSuperadmin(user, provider, audit) {
  const primary = user.email_addresses?.find(email => email.id === user.primary_email_address_id);
  if (user.banned || primary?.verification?.status !== 'verified' ||
      primary.email_address?.trim().toLowerCase() !== INITIAL_SUPERADMIN_EMAIL) return user;

  // Persist only the initial authorization. Later demotions/blocks remain authoritative.
  // Even a deliberately empty or invalid private access record must not be overwritten.
  if (Object.hasOwn(user.private_metadata || {}, 'fabricAccess')) return user;
  const invitationAccess = user.public_metadata?.fabricAccess;
  if (invitationAccess && invitationAccess.status !== 'active') return user;

  await provider.setAccess(user.id, {
    email: INITIAL_SUPERADMIN_EMAIL,
    role: 'superadmin',
    status: 'active',
    grantedBy: 'initial-owner-authorization',
    updatedAt: new Date().toISOString(),
  });
  audit({ action: 'access.initial_superadmin', actor: user.id, target: user.id });
  // Read back the persisted grant; an unsuccessful write must never authorize a request.
  return provider.getUser(user.id);
}
