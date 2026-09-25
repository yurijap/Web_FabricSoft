import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function prerender() {
  console.log('🚀 Iniciando prerenderizado SSG para la página de Inicio (/)...\n');

  const distDir = path.resolve(rootDir, 'dist');
  const indexPath = path.resolve(distDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Error: dist/index.html no existe. Ejecuta el build primero.');
    process.exit(1);
  }

  // Cargar el bundle del servidor compilado temporalmente
  const serverEntryPath = path.resolve(distDir, 'server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    console.error(`❌ Error: No se encontró el bundle del servidor en ${serverEntryPath}`);
    process.exit(1);
  }

  const { render } = await import(`file://${serverEntryPath}`);
  
  // Generar HTML estático para la ruta "/"
  const appHtml = render('/');

  // Leer index.html generado por Vite y sustituir <div id="root"></div> por el HTML estático
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Inyectar appHtml dentro de <div id="root"></div>
  const targetTag = '<div id="root"></div>';
  if (html.includes(targetTag)) {
    html = html.replace(targetTag, `<div id="root">${appHtml}</div>`);
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('✨ ¡Éxito! HTML estático prerenderizado e inyectado correctamente en dist/index.html');
  } else {
    console.warn('⚠️ Advertencia: No se encontró exactamente <div id="root"></div> en dist/index.html');
  }

  // Limpiar el directorio temporal server
  try {
    fs.rmSync(path.resolve(distDir, 'server'), { recursive: true, force: true });
    console.log('🧹 Limpieza de archivos temporales de build completada.');
  } catch (err) {
    console.warn('No se pudo eliminar el directorio temporal dist/server:', err.message);
  }
}

prerender().catch((err) => {
  console.error('❌ Error durante el prerenderizado:', err);
  process.exit(1);
});
