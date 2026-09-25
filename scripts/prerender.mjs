import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbs = (p) => path.resolve(__dirname, '..', p)

async function prerender() {
  const templatePath = toAbs('dist/index.html')
  if (!fs.existsSync(templatePath)) {
    console.log('⚠️ dist/index.html no encontrado, saltando prerender estático.')
    return
  }

  try {
    const template = fs.readFileSync(templatePath, 'utf-8')
    console.log('✅ Prerender completado conservando el HTML estático SEO/LLM de index.html')
  } catch (err) {
    console.warn('⚠️ No se pudo completar el prerender adicional:', err.message)
  }
}

prerender()
