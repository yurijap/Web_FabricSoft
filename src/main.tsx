import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { esES } from '@clerk/localizations'
import { dark } from '@clerk/themes'
import { Toaster } from 'sonner'

import App from './App.tsx'
import './index.css'
import { FabricProvider } from './store/FabricContext.tsx'


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY


const app = (
  <BrowserRouter>
    <FabricProvider>
      <App />
      <Toaster theme="dark" position="bottom-right" richColors />
    </FabricProvider>
  </BrowserRouter>
)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        localization={esES}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#ffffff',
            colorBackground: '#111111'
          }
        }}
      >
        {app}
      </ClerkProvider>
    ) : app}
  </React.StrictMode>,
)