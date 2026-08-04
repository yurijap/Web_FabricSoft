import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';


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
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const location = useLocation();


  if (!authLoaded || !userLoaded) {
    return <div className="flex justify-center p-10">Verificando gafete...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  }
 
  const rolUsuario = normalizarRol(
    (user?.publicMetadata?.rol as string) ||
    (user?.publicMetadata?.role as string) ||
    'cliente'
  );
  const rolesNormalizados = rolesPermitidos.map(normalizarRol);

 
  if (!rolesNormalizados.includes(rolUsuario)) {
  
    const rutaCorrecta = obtenerRutaPorRol(rolUsuario);
    return <Navigate to={rutaCorrecta} replace />;
  }


  return <>{children}</>;
};
