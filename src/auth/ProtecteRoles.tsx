import type { ReactNode } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { SecurityFrame, SecurityLoading } from './SecurityFrame';
import { useAccess } from './AccessContext';

export function ProtectorRoles({ children, rolesPermitidos }: { children: ReactNode; rolesPermitidos: string[] }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const location = useLocation();
  const { identity, loading, error, errorCode, refresh } = useAccess();
  if (!isLoaded) return <SecurityLoading message="Verificando credenciales…" />;
  if (!isSignedIn) return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  if (loading) return <SecurityLoading message="Verificando permisos…" />;
  if (error || !identity || !rolesPermitidos.includes(identity.rol)) {
    return <SecurityFrame title="Acceso restringido" description={errorCode === 'ACCESS_DENIED' ? 'Tu sesión está iniciada, pero esta cuenta no tiene acceso activo a la consola.' : 'Necesitamos confirmar la autorización de esta cuenta antes de abrir la consola.'} email={user?.primaryEmailAddress?.emailAddress}
      footer={<button type="button" className="fs-security__link" onClick={() => void signOut({ redirectUrl: '/acceso' })}><LogOut size={14} aria-hidden="true" />Cerrar sesión y usar otra cuenta</button>}>
      <div role="alert" className="fs-security__alert fs-security__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error || 'Tu cuenta no tiene permisos para esta sección.'}</span></div>
      <button type="button" onClick={() => void refresh()} className="fs-security__button"><RefreshCw size={17} aria-hidden="true" />Reintentar verificación</button>
      <p className="fs-security__hint">Iniciar sesión con Google no concede permisos de administrador. Si recibiste una invitación, abre su enlace con el correo invitado. Si estás usando otra cuenta, cierra la sesión para cambiarla.</p>
    </SecurityFrame>;
  }
  return <>{children}</>;
}
