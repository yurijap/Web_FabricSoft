import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { LoaderPersonalizado } from '../components/ui/LoaderPersonalizado';

export const PublicRouteProtector = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return <LoaderPersonalizado mensaje="Cargando FABRIC" pantallaCompleta={true} />;
  }
  if (isSignedIn) {
    return <Navigate to="/verificar-acceso" replace />;
  }

  return <>{children}</>;
};
