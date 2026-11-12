import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTeamDirectory } from '../src/auth/team-directory.ts';

function source(users, size = 25) {
  const offsets = [];
  return {
    offsets,
    fetchPage: async offset => {
      offsets.push(offset);
      return { users: users.slice(offset, offset + size), total: users.length };
    },
  };
}

test('uninvited Google identities do not appear alongside the owner', async () => {
  const users = [
    { id: 'google_guest', role: null, status: 'unauthorized' },
    { id: 'another_guest', role: null, status: 'unauthorized' },
    { id: 'owner', role: 'superadmin', status: 'active' },
  ];
  const original = structuredClone(users);
  const api = source(users);
  assert.deepEqual(await loadTeamDirectory(api.fetchPage), [users[2]]);
  assert.deepEqual(users, original, 'hiding identities must not modify their permissions');
});

test('withdrawn members and members with a changed email remain manageable', async () => {
  const users = [
    { id: 'invited', role: 'admin', status: 'active', accessSource: 'invitation' },
    { id: 'withdrawn', role: 'admin', status: 'blocked' },
    { id: 'changed_email', role: 'superadmin', status: 'unauthorized', accessIssue: 'email_changed' },
    { id: 'no_verified_email', role: 'admin', status: 'unauthorized', accessIssue: 'email_unverified' },
    { id: 'guest', role: null },
    { id: 'unknown_role', role: 'viewer' },
  ];
  assert.deepEqual(await loadTeamDirectory(source(users).fetchPage), users.slice(0, 4));
});

test('members are found beyond full source pages containing only hidden identities', async () => {
  const guests = Array.from({ length: 50 }, (_, i) => ({ id: `guest_${i}`, role: null }));
  const owner = { id: 'owner', role: 'superadmin' };
  const api = source([...guests, owner]);
  assert.deepEqual(await loadTeamDirectory(api.fetchPage), [owner]);
  assert.deepEqual(api.offsets, [0, 25, 50]);
});

test('visible totals and page boundaries use the filtered team', async () => {
  const users = Array.from({ length: 100 }, (_, i) => ({ id: `user_${i}`, role: i % 10 < 7 ? 'admin' : null }));
  const api = source(users);
  const members = await loadTeamDirectory(api.fetchPage);
  assert.equal(members.length, 70);
  assert.deepEqual([0, 25, 50].map(offset => members.slice(offset, offset + 25).length), [25, 25, 20]);
  assert.deepEqual(members, users.filter(user => user.role === 'admin'));
  assert.deepEqual(api.offsets, [0, 25, 50, 75]);
});

test('a search matching only uninvited identities returns no team results', async () => {
  const api = source([{ id: 'matched_guest', role: null }]);
  assert.deepEqual(await loadTeamDirectory(api.fetchPage), []);
  assert.deepEqual(await loadTeamDirectory(source([]).fetchPage), []);
});

test('an obsolete search stops after its in-flight page and discards partial results', async () => {
  let current = true;
  const offsets = [];
  const result = await loadTeamDirectory(async offset => {
    offsets.push(offset);
    if (offset === 25) current = false;
    return { users: Array.from({ length: 25 }, (_, i) => ({ id: `user_${offset + i}`, role: 'admin' })), total: 100 };
  }, () => current);
  assert.deepEqual(result, []);
  assert.deepEqual(offsets, [0, 25]);
  await loadTeamDirectory(async () => assert.fail('a cancelled load must not request pages'), () => false);
});

test('duplicate identities do not inflate the count and offsets still use raw rows', async () => {
  const owner = { id: 'owner', role: 'superadmin' };
  const api = source([owner, { id: 'guest', role: null }, owner, { id: 'admin', role: 'admin' }], 2);
  assert.deepEqual(await loadTeamDirectory(api.fetchPage), [owner, { id: 'admin', role: 'admin' }]);
  assert.deepEqual(api.offsets, [0, 2]);
});

test('invalid totals and failed pages do not produce a misleading partial directory', async () => {
  await assert.rejects(loadTeamDirectory(async () => ({ users: [], total: NaN })), /Invalid team directory page/);
  await assert.rejects(loadTeamDirectory(async offset => {
    if (offset) throw new Error('Provider unavailable');
    return { users: [{ id: 'owner', role: 'superadmin' }], total: 2 };
  }), /Provider unavailable/);
});
