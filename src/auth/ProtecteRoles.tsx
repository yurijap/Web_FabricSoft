import type { ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderPersonalizado } from '../components/ui/LoaderPersonalizado';
import { useAccess } from './AccessContext';
import MfaScreen from './MfaScreen';

export function ProtectorRoles({ children, rolesPermitidos }: { children: ReactNode; rolesPermitidos: string[] }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const location = useLocation();
  const { identity, loading, error, refresh } = useAccess();
  if (!isLoaded) return <LoaderPersonalizado mensaje="Verificando credenciales…" pantallaCompleta />;
  if (!isSignedIn) return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  if (loading) return <LoaderPersonalizado mensaje="Verificando permisos…" pantallaCompleta />;
  if (error || !identity || !rolesPermitidos.includes(identity.rol)) {
    return <main className="min-h-screen flex items-center justify-center p-6 bg-[#050B14] text-white">
      <section className="max-w-lg space-y-5">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p role="alert">{error || 'Tu cuenta no tiene permisos para esta sección.'}</p>
        <button onClick={() => void refresh()} className="rounded-lg border border-[#C9A96E] px-4 py-2">Reintentar</button>
        <button onClick={() => void signOut({ redirectUrl: '/acceso' })} className="ml-4 underline">Cerrar sesión</button>
      </section>
    </main>;
  }
  if (identity.mfaRequired && !identity.mfaVerified) return <MfaScreen />;
  return <>{children}</>;
}
