import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderPersonalizado } from '../components/ui/LoaderPersonalizado';


const normalizarRol = (rol?: string) => (rol || '').toLowerCase();

const obtenerRutaPorRol = (rol: string) => {
  switch (normalizarRol(rol)) {
    case 'admin':
    case 'superadmin':
      return '/admin';
    default:
      return '/';
  }
};

export const ProtectorRoles = ({ 
  children, 
  rolesPermitidos 
}: { 
  children: React.ReactNode, 
  rolesPermitidos: string[] 
}) => {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

  // Si no hay llave de Clerk configurada, permitir acceso a la consola
  if (!PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const location = useLocation();

  if (!authLoaded || !userLoaded) {
    return <LoaderPersonalizado mensaje="Verificando credenciales..." pantallaCompleta={true} />;
  }

  if (!isSignedIn) {
    return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  }

  const rolUsuario = normalizarRol(
    (user?.publicMetadata?.rol as string) ||
    (user?.publicMetadata?.role as string) ||
    'admin'
  );
  const rolesNormalizados = rolesPermitidos.map(normalizarRol);

  if (!rolesNormalizados.includes(rolUsuario)) {
    const rutaCorrecta = obtenerRutaPorRol(rolUsuario);
    return <Navigate to={rutaCorrecta} replace />;
  }

  return <>{children}</>;
};
