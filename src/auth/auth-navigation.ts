export const AUTH_PATHS = {
  signIn: '/acceso',
  signUp: '/crear-cuenta',
  console: '/admin',
} as const;

// Both flows need a destination: Google may transfer a sign-in to sign-up.
export const CLERK_NAVIGATION = {
  signInUrl: AUTH_PATHS.signIn,
  signUpUrl: AUTH_PATHS.signUp,
  signInForceRedirectUrl: AUTH_PATHS.console,
  signUpForceRedirectUrl: AUTH_PATHS.console,
  signInFallbackRedirectUrl: AUTH_PATHS.console,
  signUpFallbackRedirectUrl: AUTH_PATHS.console,
  afterSignOutUrl: AUTH_PATHS.signIn,
};

type ReturnLocation = { pathname: string; search: string; hash: string };

export function recoverLegacyAuthReturn({ pathname, search, hash }: ReturnLocation): ReturnLocation | null {
  if (pathname !== '/') return null;
  const params = new URLSearchParams(search);
  if (params.get('__clerk_ticket')) return { pathname: AUTH_PATHS.signUp, search, hash };
  // Compatibility with old callbacks landing at Home with a development-browser
  // handoff. Keep it intact for Clerk to consume. It never proves authentication,
  // and the normal production flow does not depend on this internal parameter.
  if (params.get('__clerk_db_jwt')) return { pathname: AUTH_PATHS.signIn, search, hash };
  return null;
}
