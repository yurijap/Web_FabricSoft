const PRODUCTION_ORIGINS = ['https://fabricsoft.com.mx', 'https://www.fabricsoft.com.mx'];

function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}

export function accessConfiguration(env = process.env) {
  const production = env.NODE_ENV === 'production' || env.VERCEL === '1';
  // Fixed, project-owned origins. Never trust Host, Origin or forwarded request
  // headers to decide which token origins may authenticate against this server.
  const defaults = production ? PRODUCTION_ORIGINS : ['https://localhost:5173'];
  const configured = env.CLERK_AUTHORIZED_PARTIES?.trim() || env.APP_ORIGIN?.trim();
  const values = configured ? configured.split(',').map(value => value.trim()) : defaults;
  const normalized = values.map(normalizeOrigin);
  // An invalid explicit configuration must fail closed, not widen access.
  const authorizedParties = normalized.every(Boolean) ? [...new Set(normalized)] : [];
  const appOrigin = normalizeOrigin(env.APP_ORIGIN?.trim() || authorizedParties[0]);
  return { authorizedParties, appOrigin };
}
