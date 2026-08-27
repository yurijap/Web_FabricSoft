import { createServer } from 'vite';

console.log('🚀 Cargando Vite Dev Server para Web_FabricSoft...');

try {
  const server = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: 5173,
      host: '0.0.0.0'
    }
  });
  await server.listen();
  server.printUrls();
  console.log('🟢 Web_FabricSoft corriendo activamente en http://localhost:5173');
} catch (err) {
  console.error('❌ Error iniciando Vite server:', err);
}

// Mantener activo el event loop de Node.js
process.stdin.resume();
