import test from 'node:test';
import assert from 'node:assert/strict';
import { deploymentSuperadmin as account } from '../scripts/deployment-superadmin-account.mjs';
import { prepareProductionSuperadmin } from '../scripts/provision-production-superadmin.mjs';
import { frontendHost, isProductionDeployment, matchingSigningKeys, provisionSuperadmin } from '../scripts/lib/provision-superadmin.mjs';
import { createProvisioningLedger } from '../scripts/lib/provisioning-ledger.mjs';
import { createIdentityProvider } from '../server/clerk.js';
import { userAccess } from '../server/access.js';

const clone = structuredClone;
const instance = 'ins_test_instance';
const migrationId = `${account.migration}:${instance}`;
const signingKeys = { keys: [{ kty: 'RSA', n: 'test-only-public-modulus', e: 'AQAB', kid: 'test-key' }] };
const env = { VERCEL: '1', VERCEL_ENV: 'production', CLERK_SECRET_KEY: 'sk_test_fake_key',
  VITE_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('test.clerk.accounts.dev$').toString('base64')}`,
  MONGODB_URI: 'mongodb://unused.test/db' };

function matches(record, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(option => matches(record, option));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.entries(value).every(([op, operand]) => op === '$exists' ? Object.hasOwn(record, key) === operand
        : op === '$ne' ? record[key] !== operand : op === '$gt' ? record[key] > operand : op === '$lte' && record[key] <= operand);
    }
    return record[key] === value;
  });
}

// Exercise the real ledger's filters/upserts, including duplicate-key locking semantics.
function memoryCollection(records) {
  return {
    async findOne(query) { return clone([...records.values()].find(record => matches(record, query)) || null); },
    async updateOne(query, update, options = {}) {
      let record = [...records.values()].find(item => matches(item, query));
      const inserted = !record;
      if (!record && !options.upsert) return { matchedCount: 0 };
      if (!record) {
        if (records.has(query._id)) throw Object.assign(new Error('duplicate key'), { code: 11000 });
        record = { _id: query._id, ...clone(update.$setOnInsert || {}) };
      }
      Object.assign(record, clone(update.$set || {}));
      for (const key of Object.keys(update.$unset || {})) delete record[key];
      records.set(record._id, record);
      return { matchedCount: inserted ? 0 : 1, upsertedCount: inserted ? 1 : 0 };
    },
  };
}

function fixture() {
  const state = { users: new Map(), records: new Map(), calls: [], now: Date.parse('2026-11-13T12:00:00Z'), closed: 0 };
  const clock = () => new Date(state.now);
  state.collection = memoryCollection(state.records);
  state.ledger = createProvisioningLedger(state.collection, migrationId, clock);
  const missing = () => Object.assign(new Error('not found'), { status: 404 });
  state.provider = {
    getInstance: async () => ({ id: instance }), getJwks: async () => clone(signingKeys),
    findUsersByEmail: async email => {
      state.calls.push(['find', email]);
      return clone([...state.users.values()].filter(user => user.email_addresses.some(address => address.email_address.toLowerCase() === email)));
    },
    getUser: async id => {
      state.calls.push(['get', id]);
      if (!state.users.has(id)) throw missing();
      const user = clone(state.users.get(id));
      return state.onRead ? state.onRead(user) : user;
    },
    createUser: async body => {
      state.calls.push(['create', clone(body)]);
      if (state.createError) throw state.createError;
      const user = { id: 'user_julio', email_addresses: [{ id: 'email_julio', email_address: body.email_address[0], verification: { status: 'verified' } }],
        primary_email_address_id: 'email_julio', password_enabled: true, private_metadata: clone(body.private_metadata), public_metadata: {} };
      state.users.set(user.id, user);
      if (state.afterCreate) await state.afterCreate(user);
      return clone(user);
    },
    updateUser: async (id, body) => {
      state.calls.push(['update', id, clone(body)]);
      if (state.updateError) throw state.updateError;
      Object.assign(state.users.get(id), { password_enabled: true, private_metadata: clone(body.private_metadata) });
    },
    setProvisioningReceipt: async (id, receipt) => {
      state.calls.push(['receipt', id, clone(receipt)]);
      if (!state.ignoreReceipt) state.users.get(id).private_metadata.fabricDeploymentProvisioning = clone(receipt);
    },
  };
  state.run = () => provisionSuperadmin({ provider: state.provider, ledger: state.ledger, account, clock });
  state.runBuild = (overrides = {}) => prepareProductionSuperadmin({ env,
    providerFactory: () => state.provider,
    openLedger: async (uri, id) => {
      assert.equal(uri, env.MONGODB_URI); assert.equal(id, migrationId);
      return { ledger: state.ledger, close: async () => { state.closed++; } };
    },
    fetchPublic: async (url, options) => {
      assert.equal(url, 'https://test.clerk.accounts.dev/.well-known/jwks.json');
      assert.equal(options.headers, undefined, 'no API key may be sent to the Frontend API');
      return { ok: true, json: async () => clone(signingKeys) };
    },
    log: message => state.calls.push(['log', message]), ...overrides });
  state.addExisting = (overrides = {}) => {
    const user = { id: 'user_existing', primary_email_address_id: 'email_existing',
      email_addresses: [{ id: 'email_existing', email_address: account.email, verification: { status: 'verified' } }],
      private_metadata: { unrelated: { keep: true }, fabricAccess: { email: account.email, role: 'admin', status: 'active' } },
      public_metadata: {}, password_enabled: false, ...overrides };
    state.users.set(user.id, user);
    return user;
  };
  return state;
}

test('local, preview, and custom builds cannot provision production users', async () => {
  for (const config of [{}, { NODE_ENV: 'production' }, { VERCEL: '1', VERCEL_ENV: 'preview' },
    { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'staging' }]) {
    assert.equal(isProductionDeployment(config), false);
    const state = fixture();
    assert.deepEqual(await state.runBuild({ env: config, providerFactory: () => assert.fail('unexpected Clerk connection'),
      openLedger: () => assert.fail('unexpected DB connection'), fetchPublic: () => assert.fail('unexpected public request') }), { status: 'skipped' });
  }
  assert.equal(isProductionDeployment(env), true);
});

test('missing or invalid production configuration fails before any network or mutation', async () => {
  for (const key of ['CLERK_SECRET_KEY', 'MONGODB_URI', 'VITE_CLERK_PUBLISHABLE_KEY']) {
    const state = fixture();
    await assert.rejects(state.runBuild({ env: { ...env, [key]: '' }, providerFactory: () => assert.fail('unexpected provider') }), /Falta /);
    assert.equal(state.users.size, 0);
    assert.equal(state.records.size, 0);
  }
  for (const host of ['http://evil.test', 'evil.test/path', 'user@evil.test', 'localhost:123']) {
    assert.throws(() => frontendHost(`pk_test_${Buffer.from(host + '$').toString('base64')}`), /dominio válido/);
  }
});

test('mismatched Clerk instance keys fail without opening MongoDB or granting access', async () => {
  assert.equal(matchingSigningKeys(signingKeys, { keys: [{ ...signingKeys.keys[0], n: 'other-instance' }] }), false);
  assert.equal(matchingSigningKeys({}, {}), false);
  const state = fixture();
  await assert.rejects(state.runBuild({ fetchPublic: async () => ({ ok: true, json: async () => ({ keys: [] }) }),
    openLedger: () => assert.fail('must not store an operation for mismatched keys') }), /misma instancia/);
  assert.equal(state.users.size, 0);
});

test('production creates exactly the requested superadmin with a digest and verifies it before completion', async () => {
  const state = fixture();
  assert.equal((await state.runBuild()).status, 'provisioned');
  const create = state.calls.find(call => call[0] === 'create')[1];
  assert.deepEqual(create.email_address, ['julio.alvarez@fabricsoft.com.mx']);
  assert.equal(create.password, undefined);
  assert.equal(create.password_digest, account.passwordDigest);
  assert.equal(create.password_hasher, 'pbkdf2_sha256');
  assert.match(account.passwordDigest, /^pbkdf2_sha256\$600000\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
  const user = state.users.get('user_julio');
  assert.equal(userAccess(user).role, 'superadmin');
  assert.equal(userAccess(user).status, 'active');
  assert.equal(user.password_enabled, true);
  assert.equal(state.records.get(migrationId).status, 'completed');
  assert.equal(state.closed, 1);
  assert.ok(!state.calls.filter(call => call[0] === 'log').some(call => call[1].includes(account.passwordDigest)));
});

test('existing verified target receives an atomic password/role update without losing other metadata', async () => {
  const state = fixture(); const user = state.addExisting();
  assert.equal((await state.run()).status, 'provisioned');
  const update = state.calls.find(call => call[0] === 'update');
  assert.equal(update[1], user.id);
  assert.equal(update[2].sign_out_of_other_sessions, true);
  assert.equal(update[2].password_digest, account.passwordDigest);
  assert.deepEqual(user.private_metadata.unrelated, { keep: true });
  assert.equal(userAccess(user).role, 'superadmin');
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 0);
});

test('future deployments preserve removed access, demotion, password changes, and account deletion', async () => {
  const state = fixture(); await state.run();
  const user = state.users.get('user_julio');
  user.private_metadata.fabricAccess = { email: account.email, role: 'admin', status: 'blocked', grantedBy: 'user_owner' };
  user.password_enabled = false;
  const writes = state.calls.length;
  assert.equal((await state.run()).status, 'already-applied');
  assert.equal(state.calls.length, writes);
  assert.equal(userAccess(user).status, 'blocked');
  state.users.delete(user.id);
  assert.equal((await state.run()).status, 'already-applied');
  assert.equal(state.users.size, 0, 'a completed receipt must not recreate a deleted account');
});

test('unverified, different-primary, suspended, and locked identities are never changed', async () => {
  for (const kind of ['unverified', 'different-primary', 'banned', 'locked']) {
    const state = fixture(); const user = state.addExisting();
    if (kind === 'unverified') user.email_addresses[0].verification.status = 'unverified';
    if (kind === 'different-primary') {
      user.email_addresses.push({ id: 'email_other', email_address: 'another@fabricsoft.com.mx', verification: { status: 'verified' } });
      user.primary_email_address_id = 'email_other';
    }
    if (kind === 'banned' || kind === 'locked') user[kind] = true;
    await assert.rejects(state.run(), /principal y verificado|suspendida o bloqueada/);
    assert.equal(state.calls.some(call => ['create', 'update', 'receipt'].includes(call[0])), false);
    assert.equal(state.records.get(migrationId).status, 'pending');
  }
});

test('a failed readback cannot report a completed credential setup on retry', async () => {
  const state = fixture(); state.onRead = user => ({ ...user, password_enabled: false });
  await assert.rejects(state.run(), /no confirmó la contraseña/);
  await assert.rejects(state.run(), /no confirmó la contraseña/);
  assert.equal(state.records.get(migrationId).status, 'pending');
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 1);
  assert.equal(state.calls.filter(call => call[0] === 'update').length, 0);
});

test('lost final MongoDB receipt is recovered without resetting an already changed password or role', async () => {
  const state = fixture(); const originalComplete = state.ledger.complete;
  state.ledger.complete = async () => { throw new Error('simulated storage outage'); };
  await assert.rejects(state.run(), /simulated storage outage/);
  state.ledger.complete = originalComplete;
  const user = state.users.get('user_julio');
  user.private_metadata.fabricAccess = { email: account.email, role: 'admin', status: 'blocked', grantedBy: 'user_owner' };
  user.password_enabled = false;
  assert.equal((await state.run()).status, 'already-applied');
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 1);
  assert.equal(state.calls.filter(call => call[0] === 'update').length, 0);
  assert.equal(user.private_metadata.fabricAccess.status, 'blocked');
});

test('a manual block during first provisioning is preserved when finalizing only the receipt', async () => {
  const state = fixture(); state.afterCreate = async user => {
    user.private_metadata.fabricAccess = { email: account.email, role: 'admin', status: 'blocked', grantedBy: 'user_owner' };
  };
  assert.equal((await state.run()).status, 'manual-decision-preserved');
  assert.equal(userAccess(state.users.get('user_julio')).status, 'blocked');
});

test('an interrupted creation is reconciled when Clerk persisted it, without another password write', async () => {
  const state = fixture(); state.afterCreate = async () => { throw new Error('response lost'); };
  await assert.rejects(state.run(), /response lost/);
  assert.equal(state.records.get(migrationId).creationStarted, true);
  delete state.afterCreate;
  assert.equal((await state.run()).status, 'provisioned');
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 1);
  assert.equal(state.calls.filter(call => call[0] === 'update').length, 0);
});

test('an unknown creation outcome cannot recreate a removed account', async () => {
  const state = fixture(); state.afterCreate = async user => { state.users.delete(user.id); throw new Error('response lost'); };
  await assert.rejects(state.run(), /response lost/);
  delete state.afterCreate;
  await assert.rejects(state.run(), /alta anterior incompleta/);
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 1);
  assert.equal(state.users.size, 0);
});

test('a known account removed during a failed attempt is not recreated', async () => {
  const state = fixture(); state.addExisting(); state.updateError = new Error('provider outage');
  await assert.rejects(state.run(), /provider outage/);
  state.users.clear(); delete state.updateError;
  assert.equal((await state.run()).status, 'account-removed');
  assert.equal(state.calls.filter(call => call[0] === 'create').length, 0);
  assert.equal(state.records.get(migrationId).status, 'completed');
});

test('explicit provider validation failures allow retry after fixing configuration', async () => {
  const state = fixture(); state.createError = Object.assign(new Error('validation rejected'), { providerStatus: 422 });
  await assert.rejects(state.run(), /validation rejected/);
  assert.equal(state.records.get(migrationId).creationStarted, false);
  delete state.createError;
  assert.equal((await state.run()).status, 'provisioned');
});

test('a lost receipt write is retried without creating or resetting another identity', async () => {
  const state = fixture(); state.ignoreReceipt = true;
  await assert.rejects(state.run(), /no confirmó el cierre/);
  state.ignoreReceipt = false;
  assert.equal((await state.run()).status, 'provisioned');
  assert.equal(state.calls.filter(call => ['create', 'update'].includes(call[0])).length, 1);
});

test('two simultaneous builds cannot both assign credentials', async () => {
  const state = fixture();
  const results = await Promise.allSettled([state.run(), state.run()]);
  assert.ok(results.some(result => result.status === 'fulfilled' && result.value.status === 'provisioned'));
  assert.equal(state.calls.filter(call => ['create', 'update'].includes(call[0])).length, 1);
  assert.equal(state.records.get(migrationId).status, 'completed');
});

test('expired leases can be recovered but the stale executor cannot write or release the new lease', async () => {
  const state = fixture(); const old = await state.ledger.claim();
  state.now += 120001;
  const current = await state.ledger.claim();
  await assert.rejects(state.ledger.record(old, { userId: 'user_stale' }), /perdió su bloqueo/);
  await state.ledger.release(old);
  await state.ledger.record(current, { userId: 'user_current' });
  assert.equal(state.records.get(migrationId).userId, 'user_current');
});

test('production closes its DB connection on a rejected Clerk mutation', async () => {
  const state = fixture(); state.createError = new Error('provider outage');
  await assert.rejects(state.runBuild(), /provider outage/);
  assert.equal(state.closed, 1);
});

test('Clerk REST adapter sends password import only to the requested identity and sanitizes provider failures', async t => {
  const requests = []; const previous = globalThis.fetch;
  t.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ id: 'user_julio' }) };
  };
  const provider = createIdentityProvider('sk_test_fake_key');
  await provider.findUsersByEmail(account.email);
  await provider.createUser({ email_address: [account.email], password_digest: account.passwordDigest, password_hasher: account.passwordHasher });
  await provider.updateUser('user_julio', { password_digest: account.passwordDigest });
  await provider.setProvisioningReceipt('user_julio', { migration: account.migration, status: 'completed' });
  assert.equal(new URL(requests[0].url).searchParams.get('email_address'), account.email);
  assert.equal(requests[1].url, 'https://api.clerk.com/v1/users');
  assert.equal(requests[2].url, 'https://api.clerk.com/v1/users/user_julio');
  assert.deepEqual(JSON.parse(requests[3].options.body), { private_metadata: { fabricDeploymentProvisioning: { migration: account.migration, status: 'completed' } } });
  assert.ok(requests.every(request => request.options.headers.Authorization === 'Bearer sk_test_fake_key'));
  globalThis.fetch = async () => ({ ok: false, status: 422, json: () => assert.fail('do not parse or log private upstream errors') });
  await assert.rejects(provider.createUser({}), error => error.status === 409 && error.providerStatus === 422 && !error.message.includes('sk_'));
});
