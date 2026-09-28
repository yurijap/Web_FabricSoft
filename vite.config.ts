import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    basicSsl(),
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
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) return 'vendor-clerk';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('@amcharts') || id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
            if (id.includes('xlsx')) return 'vendor-excel';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@tsparticles')) return 'vendor-particles';
            if (id.includes('react-router')) return 'vendor-router';
            if (
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    target: 'es2022',
  },
  css: {
    devSourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
      sourcemap: false,
    },
  },
})