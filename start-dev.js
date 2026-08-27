import path from 'path';

// Mantener activo el event loop ANTES de la importación asíncrona
const keepAlive = setInterval(() => {}, 1000);

process.env.ESBUILD_BINARY_PATH = path.join(process.cwd(), 'node_modules', '@esbuild', 'darwin-x64', 'bin', 'esbuild');

console.log('1. Importando Vite...');
const { createServer } = await import('vite');
console.log('2. Creando servidor Vite para Web_FabricSoft...');
const server = await createServer({
  configFile: path.join(process.cwd(), 'vite.config.ts'),
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
console.log('3. Iniciando servidor en puerto 5173...');
await server.listen();
console.log('4. 🟢 Web_FabricSoft Vite Server escuchando en http://localhost:5173');
server.printUrls();
