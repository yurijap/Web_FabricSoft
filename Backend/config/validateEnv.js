/**
 * Valida que todas las variables de entorno críticas estén presentes.
 * Si falta alguna, lanza un error claro en el arranque.
 */
function validateEnv() {
  const required = [
    { key: 'MONGO_URI',       hint: 'MongoDB Atlas connection string' },
    { key: 'RESEND_API_KEY',  hint: 'API key de resend.com' },
    { key: 'EMAIL_FROM',      hint: 'Ej: FABRIC <onboarding@resend.dev>' },
    { key: 'OPENAI_API_KEY',  hint: 'API key de platform.openai.com' },
    { key: 'ADMIN_API_KEY',   hint: 'Clave interna para rutas admin' },
  ];

  const optional = [
    'GOOGLE_CALENDAR_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'CLERK_WEBHOOK_SECRET',
    'CLERK_SECRET_KEY',
    'DEEPL_API_KEY',
  ];

  const missing = required.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ FALTAN VARIABLES DE ENTORNO OBLIGATORIAS:\n');
    missing.forEach(({ key, hint }) => {
      console.error(`   • ${key}  →  ${hint}`);
    });
    console.error('\n📌 En Vercel: Settings → Environment Variables');
    console.error('📌 En local:  copia backend/.env.example → backend/.env\n');
    process.exit(1);
  }

  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Variables opcionales no configuradas (algunas funciones pueden no funcionar):');
    missingOptional.forEach(key => console.warn(`   • ${key}`));
    console.warn('');
  }

  console.log('✅ Variables de entorno validadas correctamente');
}

module.exports = { validateEnv };
