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

const rootElement = document.getElementById('root')!

const removeInitialLoader = () => {
  const loader = document.getElementById('fabric-initial-loader')
  if (loader) {
    loader.style.opacity = '0'
    setTimeout(() => loader.remove(), 250)
  }
}

if (rootElement.hasChildNodes() && rootElement.firstElementChild && rootElement.firstElementChild.tagName !== 'MAIN') {
  hydrateRoot(rootElement, app)
  removeInitialLoader()
} else {
  createRoot(rootElement).render(app)
  requestAnimationFrame(removeInitialLoader)
}
