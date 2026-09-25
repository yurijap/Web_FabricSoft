import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import App from './App.tsx'
import './index.css'
import { FabricProvider } from './store/FabricContext.tsx'
import { ThemeProvider, useTheme } from './theme/ThemeProvider.tsx'

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="bottom-right" richColors />
}

// ClerkProvider ya NO envuelve la app aqui: vive en ClerkBoundary y solo
// cubre las rutas de auth/admin. Asi la landing publica no carga Clerk.
const appNode = (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FabricProvider>
          <App />
          <ThemedToaster />
        </FabricProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

const rootElement = document.getElementById('root')!;

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appNode);
} else {
  createRoot(rootElement).render(appNode);
}
