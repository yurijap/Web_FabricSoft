import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../config/api';

export type AccessIdentity = {
  userId: string;
  rol: 'admin' | 'superadmin';
};
type AccessState = {
  identity: AccessIdentity | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => Promise<void>;
};
const AccessContext = createContext<AccessState | null>(null);
export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error('Falta el proveedor de acceso.');
  return context;
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<AccessIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [checkedSession, setCheckedSession] = useState<string | null>(null);
  const sessionKey = userId && sessionId ? `${userId}:${sessionId}` : null;
  const generation = useRef(0);

  useLayoutEffect(() => {
    const request = api.interceptors.request.use(async config => {
      const token = await getToken({ skipCache: config.url === '/auth/login' });
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
      else config.headers.delete('Authorization');
      return config;
    });
    const response = api.interceptors.response.use(result => result, async failure => {
      if (failure.response?.data instanceof Blob && failure.response.data.type.includes('json')) {
        try { failure.response.data = JSON.parse(await failure.response.data.text()); } catch { /* Preserve the original error. */ }
      }
      const code = failure.response?.data?.code;
      if (failure.config?.url !== '/auth/login' && ['ACCESS_DENIED', 'SUPERADMIN_REQUIRED', 'INVALID_SESSION', 'UNAUTHENTICATED', 'AUTH_ORIGIN_NOT_ALLOWED'].includes(code)) {
        window.dispatchEvent(new Event('fabric-access-change'));
      }
      return Promise.reject(failure);
    });
    setReady(true);
    return () => { api.interceptors.request.eject(request); api.interceptors.response.eject(response); };
  }, [getToken]);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setIdentity(null);
    setError(null);
    setErrorCode(null);
    setCheckedSession(sessionKey);
    if (!isLoaded || !isSignedIn) { setLoading(!isLoaded); return; }
    setLoading(true);
    try {
      const { data } = await api.get<AccessIdentity>('/auth/login');
      if (data.userId !== userId || !['admin', 'superadmin'].includes(data.rol)) throw new Error('Unexpected access identity');
      if (current === generation.current) setIdentity(data);
    } catch (failure: unknown) {
      const data = (failure as { response?: { data?: { error?: string; code?: string } } }).response?.data;
      if (current === generation.current) {
        setError(data?.error || 'No pudimos verificar tu acceso. Revisa la conexión e intenta de nuevo.');
        setErrorCode(data?.code || null);
      }
    } finally { if (current === generation.current) setLoading(false); }
  }, [getToken, isLoaded, isSignedIn, userId, sessionId, sessionKey]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const check = () => { if (active) void refresh(); };
    check();
    window.addEventListener('fabric-access-change', check);
    return () => { active = false; ++generation.current; window.removeEventListener('fabric-access-change', check); };
  }, [ready, refresh]);

  // Hide the previous account's permissions/errors immediately during an account
  // switch, including the render before the new session's effect runs.
  const currentSession = sessionKey !== null && checkedSession === sessionKey;
  return ready ? <AccessContext.Provider value={{
    identity: currentSession && identity?.userId === userId ? identity : null,
    loading: !isLoaded || Boolean(isSignedIn && (loading || !currentSession)),
    error: currentSession ? error : null,
    errorCode: currentSession ? errorCode : null,
    refresh,
  }}>{children}</AccessContext.Provider> : null;
}
