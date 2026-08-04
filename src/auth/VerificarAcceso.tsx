import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react'; // 🔥 Importamos useClerk
import { toast } from 'sonner'; 
import { LoaderPersonalizado } from '../components/ui/LoaderPersonalizado';
import { api } from '../config/api'; 

export const VerificarAcceso = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser(); 
  const { signOut } = useClerk(); 
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const validacionIniciada = useRef(false);

  useEffect(() => {
    const validarConBackend = async () => {
      if (!isLoaded) return;
      if (validacionIniciada.current) return;

      if (!isSignedIn) {
        navigate('/acceso/*', { replace: true });
        return;
      }

      validacionIniciada.current = true;

      try {
        const token = await getToken();
        
        const { data } = await api.get('/auth/login', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

       

        if (data.status === 'bloqueado' || data.status === 'desactivado') {
          toast.error("Acceso Denegado", { description: "Cuenta inactiva." });
          setError("Tu cuenta ha sido desactivada. Cerrando sesión...");
          
       
          setTimeout(() => {
            signOut();
          }, 6000);
          return; 
        }

        toast.success(`¡Bienvenido de nuevo, ${user?.firstName || 'Inge'}!`, {
          description: 'Hemos sincronizado tu acceso correctamente.',
          duration: 4000,
        });
        
  
        if (['admin', 'superadmin'].includes(String(data.rol).toLowerCase())) {
          navigate('/admin', { replace: true });

         }

      } catch (err: any) {
        console.error("Error validando sesión:", err);
        
        const mensajeFriendly = err.response?.data?.error || "No pudimos cargar tu perfil.";
        toast.error('Error de Sincronización', {
          description: mensajeFriendly,
          action: {
            label: 'Reintentar',
            onClick: () => window.location.reload(),
          },
        });

        setError("Hubo un problema al cargar tu perfil. Contacta a soporte o intenta recargar la página.");
        
 
        setTimeout(() => signOut(), 5000);
      }
    };

    validarConBackend();
  }, [isLoaded, isSignedIn, getToken, navigate, user, signOut]);

  return (
    <LoaderPersonalizado 
      mensaje="Preparando tu espacio de trabajo..." 
      error={error} 
      pantallaCompleta={true}
    />
  );
};
