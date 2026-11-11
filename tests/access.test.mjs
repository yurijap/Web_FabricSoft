import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import express from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { createAccessControl, userAccess, hasRecentMfa } from '../server/access.js';
import { INITIAL_SUPERADMIN_EMAIL } from '../server/initial-superadmin.js';
import { accessConfiguration } from '../server/access-config.js';

const origin = 'https://localhost:5173';
const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwtKey = key.publicKey.export({ type: 'spki', format: 'pem' });
const verifier = createClerkClient({ secretKey: 'sk_test_local_test_only' });
function token(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'local' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ sub: 'user_owner', sid: 'sess_owner', azp: origin,
    iss: 'https://local.clerk.accounts.dev', iat: now, nbf: now - 1, exp: now + 60, fva: [0, 0], ...overrides })).toString('base64url');
  const signed = `${header}.${body}`;
  return `${signed}.${sign('RSA-SHA256', Buffer.from(signed), key.privateKey).toString('base64url')}`;
}
function account(id = 'user_owner', role = 'superadmin') {
  return { id, primary_email_address_id: 'id_email', first_name: 'Test', last_name: 'User',
    email_addresses: [{ id: 'id_email', email_address: `${id}@example.com`, verification: { status: 'verified' } }],
    private_metadata: { fabricAccess: { email: `${id}@example.com`, role, status: 'active' } },
    public_metadata: {}, totp_enabled: true };
}
async function fixture(t, { configured = true, configuration = { authorizedParties: [origin], appOrigin: origin } } = {}) {
  const owner = account();
  const target = account('user_target', 'admin');
  const state = { owner, target, session: { status: 'active', user_id: owner.id, expire_at: Date.now() + 3600000 }, calls: [], audit: [], outage: false };
  const provider = {
    verifyToken: (value, authorizedParties) => verifier.verifyToken(value, { jwtKey, authorizedParties }),
    getUser: async id => { if (state.outage) throw new Error('private upstream detail'); return id === target.id ? target : owner; },
    getSession: async () => state.session,
    listUsers: async () => [owner, target], countUsers: async () => ({ total_count: 2 }),
    listInvitations: async () => [{ id: 'inv_test', email_address: 'new@example.com', status: 'pending', public_metadata: { fabricAccess: { role: 'admin' } }, url: 'secret-ticket' }],
    invite: async body => { state.calls.push(['invite', body]); return { id: 'inv_test' }; },
    revokeInvitation: async id => state.calls.push(['revoke', id]),
    setAccess: async (id, access) => {
      state.calls.push(['set', id, access]);
      if (state.writeFailure) throw new Error('Provider write failed');
      (id === owner.id ? owner : target).private_metadata.fabricAccess = access;
    },
  };
  const { router, protect } = createAccessControl({ provider: configured ? provider : null, ...configuration, audit: event => state.audit.push(event) });
  const app = express();
  app.use(express.json()); app.use('/api', router); app.use(protect);
  app.use((req, res) => res.json({ success: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  state.request = async (path, { jwt = token(), method = 'GET', body } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };
  return state;
}

test('Clerk verification rejects forged, expired and foreign-origin tokens', async t => {
  const state = await fixture(t);
  for (const jwt of ['forged.token.value', token({ exp: 1 }), token({ azp: 'https://evil.example' }), token({ sid: undefined }), token({ act: { sub: 'impersonator' } })]) {
    assert.equal((await state.request('/api/leads', { jwt })).status, 401);
  }
  assert.equal((await state.request('/api/leads', { jwt: null })).status, 401);
  assert.equal((await state.request('/api/leads')).status, 200);
});

test('no secret/configuration fails closed before private handlers; public forms still work', async t => {
  const state = await fixture(t, { configured: false });
  assert.equal((await state.request('/api/auth/login')).status, 503);
  assert.equal((await state.request('/api/admin/clear-db', { method: 'DELETE', jwt: null })).status, 503);
  assert.equal((await state.request('/api/leads/solicitar', { method: 'POST', jwt: null, body: {} })).status, 200);
});

test('missing authorization, unsafe/client roles and unverified emails never grant access', async t => {
  const state = await fixture(t);
  state.owner.private_metadata = {};
  state.owner.public_metadata = { role: 'superadmin', rol: 'admin' };
  state.owner.unsafe_metadata = { fabricAccess: { role: 'superadmin', status: 'active' } };
  assert.equal((await state.request('/api/auth/login')).status, 403);
  state.owner.private_metadata = account().private_metadata;
  state.owner.email_addresses[0].verification.status = 'unverified';
  assert.equal((await state.request('/api/auth/login')).status, 403);
});

test('revoked sessions and blocked users are rejected even with a valid JWT', async t => {
  const state = await fixture(t);
  state.session.status = 'revoked';
  assert.equal((await state.request('/api/leads')).status, 401);
  state.session.status = 'active'; state.owner.private_metadata.fabricAccess.status = 'blocked';
  assert.equal((await state.request('/api/leads')).status, 403);
});

test('superadmin must enroll TOTP and verify a recent second factor; login only exposes enrollment status', async t => {
  const state = await fixture(t);
  for (const fva of [undefined, [0, -1], [0, 15], [0, '0']]) {
    const response = await state.request('/api/access/users', { jwt: token({ fva }) });
    assert.equal(response.status, 403); assert.equal(response.data.code, 'MFA_REQUIRED');
    const login = await state.request('/api/auth/login', { jwt: token({ fva }) });
    assert.equal(login.status, 200); assert.equal(login.data.mfaVerified, false);
  }
  state.owner.totp_enabled = false;
  const response = await state.request('/api/leads');
  assert.equal(response.data.code, 'MFA_ENROLLMENT_REQUIRED');
  assert.equal((await state.request('/api/access/users')).status, 403);
});

test('admins can operate the console but cannot manage any users or invitations', async t => {
  const state = await fixture(t);
  state.owner.private_metadata.fabricAccess.role = 'admin';
  assert.equal((await state.request('/api/leads')).status, 200);
  for (const [path, method, body] of [
    ['/api/access/users', 'GET'], ['/api/access/invitations', 'GET'],
    ['/api/access/invitations', 'POST', { email: 'new@example.com', role: 'superadmin' }],
    ['/api/access/users/user_target', 'PATCH', { role: 'superadmin', status: 'active' }],
    ['/api/access/invitations/inv_test/revoke', 'POST'],
    ['/api/admin/clear-db', 'DELETE'],
  ]) assert.equal((await state.request(path, { method, body })).status, 403);
  assert.equal(state.calls.length, 0);
});

test('invitations carry server-written access, a fixed redirect and expiry; response never leaks tickets', async t => {
  const state = await fixture(t);
  assert.equal((await state.request('/api/access/invitations', { method: 'POST', body: { email: ' NEW@EXAMPLE.COM ', role: 'admin', redirect_url: 'https://evil.example' } })).status, 201);
  const body = state.calls[0][1];
  assert.equal(body.redirect_url, `${origin}/crear-cuenta`);
  assert.equal(body.email_address, 'new@example.com');
  assert.equal(body.expires_in_days, 7);
  const invited = account('user_new', 'admin'); invited.private_metadata = {}; invited.public_metadata = body.public_metadata;
  invited.email_addresses[0].email_address = 'new@example.com';
  assert.equal(userAccess(invited).role, 'admin');
  invited.private_metadata.fabricAccess = { ...body.public_metadata.fabricAccess, status: 'blocked' };
  assert.equal(userAccess(invited).status, 'blocked');
  const pending = await state.request('/api/access/invitations');
  assert.equal(pending.data.invitations[0].url, undefined);
  assert.equal(state.audit[0].action, 'access.invited');
});

test('superadmin can grant/change/block access; same signed JWT immediately loses authorization', async t => {
  const state = await fixture(t);
  const jwt = token({ sub: 'user_target' });
  const update = await state.request('/api/access/users/user_target', { method: 'PATCH', body: { role: 'superadmin', status: 'blocked' } });
  assert.equal(update.status, 200);
  state.session.user_id = 'user_target';
  assert.equal((await state.request('/api/leads', { jwt })).status, 403);
  state.session.user_id = 'user_owner';
  assert.equal((await state.request('/api/access/users/user_owner', { method: 'PATCH', body: { role: 'admin', status: 'blocked' } })).data.code, 'SELF_CHANGE_FORBIDDEN');
  const result = await state.request('/api/access/users');
  assert.equal(result.status, 200); assert.equal(result.data.users[0].private_metadata, undefined);
});

test('legacy private aliases and downloads cannot bypass authorization', async t => {
  const state = await fixture(t);
  for (const [path, method] of [
    ['/api/leads', 'GET'], ['/api/admin/clear-db', 'POST'], ['/api/admin/clear-db', 'DELETE'],
    ['/api/files/file-id/download', 'GET'], ['/api/files/upload', 'POST'],
    ['/fusion-rescue/submissions/lead-id', 'DELETE'], ['/rescue-assessment/submissions', 'GET'],
    ['/api/fusion-rescue/submissions/lead-id/permanent', 'DELETE'], ['/api/office-hours/book', 'POST'],
    ['/api/referencias', 'POST'], ['/api/future-sensitive-endpoint', 'GET'],
  ]) assert.equal((await state.request(path, { method, jwt: null })).status, 401, `${method} ${path}`);
});

test('revocation and reactivation work, and promotion immediately requires MFA', async t => {
  const state = await fixture(t);
  assert.equal((await state.request('/api/access/invitations/inv_test/revoke', { method: 'POST' })).status, 200);
  assert.deepEqual(state.calls[0], ['revoke', 'inv_test']);
  state.target.private_metadata.fabricAccess.status = 'blocked';
  const jwt = token({ sub: 'user_target', fva: [0, -1] });
  assert.equal((await state.request('/api/access/users/user_target', { method: 'PATCH', body: { role: 'superadmin', status: 'active' } })).status, 200);
  state.session.user_id = 'user_target';
  const response = await state.request('/api/leads', { jwt });
  assert.equal(response.status, 403);
  assert.equal(response.data.code, 'MFA_REQUIRED');
  assert.equal((await state.request('/api/leads', { jwt: token({ sub: 'user_target' }) })).status, 200);
});

test('provider outage fails closed and invalid mutations have no side effects', async t => {
  const state = await fixture(t);
  for (const body of [{ email: 'invalid', role: 'admin' }, { email: 'x@example.com', role: 'owner' }]) {
    assert.equal((await state.request('/api/access/invitations', { method: 'POST', body })).status, 400);
  }
  assert.equal(state.calls.length, 0);
  state.outage = true;
  const failure = await state.request('/api/leads');
  assert.equal(failure.status, 503);
  assert.equal(JSON.stringify(failure.data).includes('private upstream detail'), false);
  state.outage = false;
  state.owner.banned = true;
  assert.equal((await state.request('/api/leads')).status, 403);
  assert.equal(hasRecentMfa(account(), { fva: [0, 0] }), true);
});

function initialOwner(state) {
  state.owner.private_metadata = {};
  state.owner.email_addresses[0].email_address = INITIAL_SUPERADMIN_EMAIL;
}

test('the explicitly authorized verified email receives a persisted superadmin role on login and must still pass MFA', async t => {
  assert.equal(INITIAL_SUPERADMIN_EMAIL, 'edilbertoh369@gmail.com');
  const state = await fixture(t);
  initialOwner(state);
  state.owner.totp_enabled = false;
  state.owner.email_addresses[0].email_address = INITIAL_SUPERADMIN_EMAIL.toUpperCase();
  const login = await state.request('/api/auth/login');
  assert.equal(login.status, 200);
  assert.equal(login.data.rol, 'superadmin');
  assert.equal(login.data.mfaRequired, true);
  assert.equal(login.data.mfaVerified, false);
  assert.equal(state.owner.private_metadata.fabricAccess.grantedBy, 'initial-owner-authorization');
  assert.equal(state.calls.length, 1);
  assert.equal((await state.request('/api/access/users')).data.code, 'MFA_ENROLLMENT_REQUIRED');
  await state.request('/api/auth/login');
  assert.equal(state.calls.length, 1, 'the initial grant must be written only once');
  assert.equal(state.audit[0].action, 'access.initial_superadmin');
});

test('initial-owner provisioning never trusts token email, unverified email, secondary email, or revoked sessions', async t => {
  const state = await fixture(t);
  state.owner.private_metadata = {};
  assert.equal((await state.request('/api/auth/login', { jwt: token({ email: INITIAL_SUPERADMIN_EMAIL }) })).status, 403);
  initialOwner(state);
  state.owner.email_addresses[0].verification.status = 'unverified';
  assert.equal((await state.request('/api/auth/login')).status, 403);
  state.owner.email_addresses[0].verification.status = 'verified';
  state.owner.primary_email_address_id = 'different_primary';
  assert.equal((await state.request('/api/auth/login')).status, 403);
  state.owner.primary_email_address_id = 'id_email';
  state.session.status = 'revoked';
  assert.equal((await state.request('/api/auth/login')).status, 401);
  assert.equal((await state.request('/api/auth/login', { jwt: 'forged.token.value' })).status, 401);
  assert.equal(state.calls.length, 0);
});

test('initial-owner provisioning preserves subsequent blocks, demotions and explicitly empty private access', async t => {
  const state = await fixture(t);
  initialOwner(state);
  state.owner.private_metadata.fabricAccess = { email: INITIAL_SUPERADMIN_EMAIL, role: 'superadmin', status: 'blocked' };
  assert.equal((await state.request('/api/auth/login')).status, 403);
  state.owner.private_metadata.fabricAccess = { email: INITIAL_SUPERADMIN_EMAIL, role: 'admin', status: 'active' };
  const login = await state.request('/api/auth/login');
  assert.equal(login.data.rol, 'admin');
  state.owner.private_metadata.fabricAccess = null;
  assert.equal((await state.request('/api/auth/login')).status, 403);
  assert.equal(state.calls.length, 0);
});

test('initial-owner provisioning cannot grant access if the provider cannot persist it or configuration is missing', async t => {
  const state = await fixture(t);
  initialOwner(state);
  state.writeFailure = true;
  assert.equal((await state.request('/api/auth/login')).status, 503);
  assert.equal(state.owner.private_metadata.fabricAccess, undefined);
  assert.equal((await state.request('/api/leads')).status, 403);
  const missing = await fixture(t, { configured: false });
  initialOwner(missing);
  assert.equal((await missing.request('/api/auth/login')).status, 503);
  assert.equal(missing.calls.length, 0);
});

test('production accepts the verified initial owner on the real domain and still enforces MFA', async t => {
  const configuration = accessConfiguration({ VERCEL: '1', NODE_ENV: 'production' });
  const state = await fixture(t, { configuration });
  initialOwner(state);
  for (const azp of ['https://fabricsoft.com.mx', 'https://www.fabricsoft.com.mx']) {
    const jwt = token({ azp, fva: [0, -1] });
    const login = await state.request('/api/auth/login', { jwt });
    assert.equal(login.status, 200);
    assert.equal(login.data.rol, 'superadmin');
    assert.equal(login.data.mfaVerified, false);
    assert.equal((await state.request('/api/access/users', { jwt })).data.code, 'MFA_REQUIRED');
    assert.equal((await state.request('/api/access/users', { jwt: token({ azp }) })).status, 200);
  }
  for (const azp of [origin, 'https://evil.example', 'https://fabricsoft.com.mx.evil.example']) {
    const result = await state.request('/api/auth/login', { jwt: token({ azp }) });
    assert.equal(result.status, 401);
    assert.equal(result.data.code, 'AUTH_ORIGIN_NOT_ALLOWED');
  }
});

test('development, production and explicit origin configuration remain separate and invalid settings fail closed', async t => {
  assert.deepEqual(accessConfiguration({}), { authorizedParties: [origin], appOrigin: origin });
  assert.deepEqual(accessConfiguration({ NODE_ENV: 'production' }), accessConfiguration({ VERCEL: '1' }));
  assert.deepEqual(accessConfiguration({ VERCEL: '1', APP_ORIGIN: 'https://other.example/' }), {
    authorizedParties: ['https://other.example'], appOrigin: 'https://other.example',
  });
  const explicit = accessConfiguration({ VERCEL: '1', CLERK_AUTHORIZED_PARTIES: 'https://a.example/, https://b.example', APP_ORIGIN: 'https://b.example/' });
  assert.deepEqual(explicit, { authorizedParties: ['https://a.example', 'https://b.example'], appOrigin: 'https://b.example' });
  for (const value of ['*', 'https://domain.example/path', 'https://user:password@domain.example', 'https://ok.example,']) {
    const configuration = accessConfiguration({ VERCEL: '1', CLERK_AUTHORIZED_PARTIES: value });
    assert.deepEqual(configuration.authorizedParties, []);
    const state = await fixture(t, { configuration });
    assert.equal((await state.request('/api/auth/login')).status, 503);
  }
});

test('an explicit localhost-only production setting gives an actionable error without exposing tokens', async t => {
  const configuration = accessConfiguration({ NODE_ENV: 'production', CLERK_AUTHORIZED_PARTIES: origin });
  const state = await fixture(t, { configuration });
  const jwt = token({ azp: 'https://fabricsoft.com.mx' });
  const response = await state.request('/api/auth/login', { jwt });
  assert.equal(response.status, 401);
  assert.equal(response.data.code, 'AUTH_ORIGIN_NOT_ALLOWED');
  assert.equal(state.audit[0].reason, 'origin-not-allowed');
  assert.equal(JSON.stringify(state.audit).includes(jwt), false);
});
