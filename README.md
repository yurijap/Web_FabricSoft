# FabriSoft — Oracle Critical Engineering

Sitio web de FABRIC: firma de implementacion Oracle Fusion en Mexico.
Stack premium, estetica editorial dark. Vite + React + TypeScript + Tailwind CSS v4.

---

## Estructura del proyecto

```
/
|-- src/              <- Frontend principal (Vite + React SPA)
|   |-- pages/
|   |   |-- public/   <- Paginas y secciones del sitio (s01-s15)
|   |   |-- admin/    <- Panel de administracion (Clerk)
|   |-- components/   <- Componentes reutilizables
|   |-- store/        <- Estado global (FabricContext + fabricStore)
|   |-- hooks/        <- Custom hooks
|   |-- layouts/      <- Wrappers de layout
|   |-- routers/      <- Configuracion React Router v7
|   `-- assets/       <- Imagenes, logos
|
|-- frontend/         <- Frontend Next.js (SSR - Edilberto)
|-- backend/          <- API REST (Express + TypeScript)
|   `-- src/
|       |-- routes/   <- /api/leads, /api/metricas, /api/office-hours
|       |-- middleware/<- Auth, validacion
|       `-- models/   <- Tipos compartidos frontend/backend
|
|-- public/           <- Assets estaticos del frontend Vite
|-- docs/             <- Documentacion del proyecto
`-- design/           <- Maquetas, prototipos HTML, referencias visuales
```

---

## Comandos

```bash
# Instalar dependencias (todo el monorepo)
pnpm install

# Frontend Vite -- dev
pnpm dev                   # http://localhost:5173

# Backend Express -- dev
cd backend && pnpm dev     # http://localhost:3001

# Frontend Next.js -- dev
cd frontend && pnpm dev    # http://localhost:3000

# TypeScript check
npx tsc --noEmit
```

---

## Variables de entorno

Frontend (.env.local en raiz):
  VITE_CLERK_PUBLISHABLE_KEY=pk_...
  VITE_API_URL=http://localhost:3001

Backend (backend/.env, copiar de backend/.env.example):
  PORT=3001
  FRONTEND_URL=http://localhost:5173
  API_KEY=clave-secreta

---

## Division de trabajo

| Seccion       | Quien     | Archivos                          |
|---------------|-----------|-----------------------------------|
| S01-S06       | Edilberto | src/pages/public/home/s01-s06*    |
| S07-S15       | Tibor     | src/pages/public/home/s07-s15*    |
| Admin Panel   | Edilberto | src/pages/admin/                  |
| Store / Estado| Edilberto | src/store/                        |
| CSS maquetado | Tibor     | src/maquetado-dossier.css         |

---

## Notas de arquitectura

- Estado: Todo vive en FabricContext (en memoria). Cuando se conecte
  el backend, solo cambia fabricStore.ts.
- Autenticacion: Clerk (React). Admin protegido con SignedIn.
- Backend: Scaffolding listo en backend/. Rutas espejo del store actual.
- CSS Cascade: maquetado-dossier.css es CSS sin capa, tiene mayor
  prioridad que @layer de Tailwind. Ver docs/ para detalles.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
