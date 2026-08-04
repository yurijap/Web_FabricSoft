import { ClerkProvider } from '@clerk/clerk-react';
import { esES } from '@clerk/localizations';
import { dark } from '@clerk/themes';
import { Outlet } from 'react-router-dom';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

/**
 * Provee ClerkProvider SOLO a las rutas que necesitan autenticacion
 * (auth + admin). Las rutas publicas quedan fuera de este limite, de modo
 * que la landing no carga ni ejecuta el runtime de Clerk en el camino
 * critico de renderizado. Se monta de forma lazy desde el router.
 */
export default function ClerkBoundary() {
  if (!PUBLISHABLE_KEY) {
    return <Outlet />;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      localization={esES}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffffff',
          colorBackground: '#111111',
        },
      }}
    >
      <Outlet />
    </ClerkProvider>
  );
}
