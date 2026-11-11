import type { ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { SecurityFrame, SecurityLoading } from './SecurityFrame';
import { useAccess } from './AccessContext';

export function ProtectorRoles({ children, rolesPermitidos }: { children: ReactNode; rolesPermitidos: string[] }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const location = useLocation();
  const { identity, loading, error, refresh } = useAccess();
  if (!isLoaded) return <SecurityLoading message="Verificando credenciales…" />;
  if (!isSignedIn) return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  if (loading) return <SecurityLoading message="Verificando permisos…" />;
  if (error || !identity || !rolesPermitidos.includes(identity.rol)) {
    return <SecurityFrame title="Acceso restringido" description="Necesitamos confirmar tu autorización antes de abrir la consola."
      footer={<button type="button" className="fs-security__link" onClick={() => void signOut({ redirectUrl: '/acceso' })}><LogOut size={14} aria-hidden="true" />Cerrar sesión</button>}>
      <div role="alert" className="fs-security__alert fs-security__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error || 'Tu cuenta no tiene permisos para esta sección.'}</span></div>
      <button type="button" onClick={() => void refresh()} className="fs-security__button"><RefreshCw size={17} aria-hidden="true" />Reintentar verificación</button>
    </SecurityFrame>;
  }
  return <>{children}</>;
}
