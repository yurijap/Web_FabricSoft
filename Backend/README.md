# FabriSoft Backend — Setup Guide

## 1. Variables de Entorno en Vercel

> **IMPORTANTE**: El backend NO funcionará en producción sin estas variables.  
> Las variables del archivo `.env` NO se suben a GitHub (están en `.gitignore`).

### Cómo configurarlas en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Abre el proyecto `equipo-a-v2`
3. Ve a **Settings → Environment Variables**
4. Agrega **cada variable** con entorno: `Production ✓ Preview ✓ Development ✓`

---

### Variables requeridas (el backend NO arranca sin estas)

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `MONGO_URI` | Connection string de MongoDB | cloud.mongodb.com → Connect → Drivers |
| `RESEND_API_KEY` | API key para envío de emails | resend.com → API Keys |
| `EMAIL_FROM` | Remitente de emails | `FABRIC <onboarding@resend.dev>` |
| `OPENAI_API_KEY` | API key de OpenAI | platform.openai.com → API Keys |
| `ADMIN_API_KEY` | Clave interna de rutas admin | `fabric_admin_2026` |

### Variables opcionales (funciones específicas)

| Variable | Función |
|----------|---------|
| `GOOGLE_CALENDAR_ID` | Office Hours calendar |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Office Hours calendar |
| `GOOGLE_PRIVATE_KEY` | Office Hours calendar |
| `GOOGLE_CALENDAR_TIMEZONE` | Office Hours calendar |
| `CLERK_WEBHOOK_SECRET` | Webhooks de autenticación |
| `CLERK_SECRET_KEY` | Autenticación Clerk |
| `DEEPL_API_KEY` | Traducciones automáticas |

---

## 2. Setup local

```bash
# 1. Clonar el repo
git clone https://github.com/Tiboryeah/FabricSoftPage.git
cd FabricSoftPage/backend

# 2. Copiar el template de variables
cp .env.example .env

# 3. Editar .env con los valores reales (pedir a Esteban)
# Abre .env y rellena cada variable

# 4. Instalar dependencias
npm install

# 5. Correr en desarrollo
npm run dev
```

---

## 3. Sobre el envío de correos (Resend)

- La API key `RESEND_API_KEY` es suficiente para enviar a **cualquier destinatario**
- Con `EMAIL_FROM=FABRIC <onboarding@resend.dev>` funciona inmediatamente sin dominio propio
- Límite del plan gratuito: **3,000 emails/mes**
- Si en el futuro se quiere usar `noreply@fabricsoft.com.mx`:
  1. Ir a resend.com → Domains → Add Domain → `fabricsoft.com.mx`
  2. Agregar los registros DNS indicados
  3. Cambiar `EMAIL_FROM` a `FABRIC <noreply@fabricsoft.com.mx>`

---

## 4. Estructura del proyecto

```
backend/
├── config/
│   ├── db.js           # Conexión a MongoDB
│   └── validateEnv.js  # Validación de variables al arranque
├── controllers/        # Lógica de negocio por módulo
├── routers/            # Rutas Express
├── services/
│   └── email.service.js  # Templates y envío con Resend
├── .env.example        # Template de variables (copia esto como .env)
└── index.js            # Entry point
```

---

## 5. Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/_/backend/api/health` | Health check |
| POST | `/_/backend/api/leads` | Registro de leads |
| POST | `/_/backend/api/office-hours/reservar` | Reservar Office Hours |
| GET | `/_/backend/api/metricas` | Métricas del dashboard |
