import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_PATHS, CLERK_NAVIGATION, recoverLegacyAuthReturn } from '../src/auth/auth-navigation.ts';

test('Google sign-in and sign-up transfers have a fixed destination inside the guarded console', () => {
  for (const key of ['signInForceRedirectUrl', 'signUpForceRedirectUrl', 'signInFallbackRedirectUrl', 'signUpFallbackRedirectUrl']) {
    assert.equal(CLERK_NAVIGATION[key], AUTH_PATHS.console, key);
  }
  assert.equal(CLERK_NAVIGATION.signInUrl, '/acceso');
  assert.equal(CLERK_NAVIGATION.signUpUrl, '/crear-cuenta');
});

test('an old Google return at Home reaches Clerk with the original handoff and does not loop', () => {
  const location = { pathname: '/', search: '?__clerk_db_jwt=fake-handoff&locale=es', hash: '#return' };
  const next = recoverLegacyAuthReturn(location);
  assert.deepEqual(next, { ...location, pathname: '/acceso' });
  assert.equal(recoverLegacyAuthReturn(next), null);
  assert.equal(location.pathname, '/', 'the input remains unchanged');
});

test('a registration return preserves its invitation even when a browser handoff is also present', () => {
  const location = { pathname: '/', search: '?__clerk_db_jwt=fake-handoff&__clerk_ticket=fake-invitation&__clerk_status=sign_up', hash: '' };
  assert.deepEqual(recoverLegacyAuthReturn(location), { ...location, pathname: '/crear-cuenta' });
});

test('public visits and unrelated query parameters keep the public website', () => {
  for (const [pathname, search, hash] of [
    ['/', '', ''], ['/', '?utm_source=google', '#casos'], ['/', '?email=persona@gmail.com', ''],
    ['/', '?redirect_url=https%3A%2F%2Foutside.example', ''], ['/', '?__clerk_db_jwt=', ''],
    ['/casos/ejemplo', '?__clerk_db_jwt=fake-handoff', ''], ['/acceso', '?__clerk_db_jwt=fake-handoff', ''],
    ['/admin', '?__clerk_db_jwt=fake-handoff', ''],
  ]) assert.equal(recoverLegacyAuthReturn({ pathname, search, hash }), null, pathname + search);
});

test('a caller-controlled destination cannot select an external site or an administrative operation', () => {
  for (const destination of ['https://outside.example', '//outside.example', '/api/admin/clear-db', '/admin/usuarios']) {
    const location = { pathname: '/', search: `?__clerk_db_jwt=fake-handoff&redirect_url=${encodeURIComponent(destination)}`, hash: '' };
    assert.equal(recoverLegacyAuthReturn(location).pathname, '/acceso');
  }
});
