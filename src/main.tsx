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

const container = document.getElementById('root')!
const app = (
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
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}

