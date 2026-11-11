import { ClerkProvider } from '@clerk/clerk-react';
import { esES } from '@clerk/localizations';
import { dark } from '@clerk/themes';
import { Outlet } from 'react-router-dom';
import { AccessProvider } from './AccessContext';
import { SecurityFrame } from './SecurityFrame';
import { useTheme } from '../theme/ThemeProvider';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

/**
 * Provee ClerkProvider SOLO a las rutas que necesitan autenticacion
 * (auth + admin). Las rutas publicas quedan fuera de este limite, de modo
 * que la landing no carga ni ejecuta el runtime de Clerk en el camino
 * critico de renderizado. Se monta de forma lazy desde el router.
 */
function isValidClerkKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  try {
    const raw = key.replace(/^(pk_test_|pk_live_)/, '');
    const decoded = atob(raw);
    return decoded.includes('.') || decoded.includes('clerk');
  } catch {
    return false;
  }
}

export default function ClerkBoundary() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  if (!isValidClerkKey(PUBLISHABLE_KEY)) {
    return <SecurityFrame title="El acceso aún no está disponible" description="El acceso administrativo no está configurado."><p role="alert">Contacta al responsable de la plataforma para continuar.</p></SecurityFrame>;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY!}
      localization={esES}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: isDark ? '#d1b079' : '#8c611f',
          colorBackground: isDark ? '#10223a' : '#fffefa',
          colorText: isDark ? '#f0f4fa' : '#1c2831',
          colorTextSecondary: isDark ? '#b1bfd0' : '#53616c',
          colorInputBackground: isDark ? '#142b46' : '#f2efe7',
          colorInputText: isDark ? '#f0f4fa' : '#1c2831',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.625rem',
        },
      }}
    >
      <AccessProvider><Outlet /></AccessProvider>
    </ClerkProvider>
  );
}
