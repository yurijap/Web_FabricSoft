import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    host: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vendor de React en su propio chunk cacheable. Clerk se separa solo
        // porque ahora solo se importa de forma lazy (ClerkBoundary).
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'react-router';
            if (
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('scheduler')
            ) {
              return 'react';
            }
          }
        },
      },
    },
  },
  css: {
    devSourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false,
    },
  },
})