# Usuarios, accesos y MFA

El panel **Sistema → Usuarios y accesos** (`/admin/usuarios`) permite al superadmin invitar, revocar invitaciones, autorizar cuentas existentes, cambiar entre `admin` y `superadmin`, y bloquear el acceso. Un admin opera la consola pero no administra accesos. La cuenta actual no puede bloquearse ni cambiar su propio rol.

## Configuración inicial (una sola vez)

**Cuenta inicial autorizada:** `edilbertoh369@gmail.com`. Después de desplegar estos cambios en Vercel, entra a `/acceso` con esa cuenta. El backend comprueba que sea su correo principal verificado en Clerk y guarda el rol `superadmin` la primera vez. No necesitas el script ni entrar al panel de Clerk para asignar ese rol. La asignación no se repite si la cuenta ya tiene un registro privado de acceso: bloqueos y cambios de rol posteriores se respetan.

Este mecanismo exige `CLERK_SECRET_KEY` y los orígenes correctos en el backend de Vercel. No sustituye esas credenciales ni habilita TOTP en la instancia de Clerk. Los ajustes existentes de Vercel se conservan; no se modificaron desde este entorno. Sin credenciales locales ni conexión a Vercel, la asignación real queda pendiente del despliegue y del inicio de sesión. El superadmin sigue obligado a configurar y verificar MFA antes de usar la consola.

Para configurar otra instalación desde cero o recuperar la administración localmente:

1. En **`.env.local`**, configura `CLERK_SECRET_KEY` de la misma instancia que `VITE_CLERK_PUBLISHABLE_KEY`. Esta clave es exclusiva del servidor. `.env` y `env.txt` ya estaban versionados en este repositorio: **no pongas secretos en esos archivos**. El backend y el script leen primero `.env.local`, sin sobrescribir variables proporcionadas por el entorno.
2. Configura `APP_ORIGIN=https://localhost:5173` y `CLERK_AUTHORIZED_PARTIES=https://localhost:5173`. En producción usa tu dominio HTTPS real y claves de producción de esa misma instancia. Si usas más de un origen, sepáralos con comas en `CLERK_AUTHORIZED_PARTIES`. Configura `MONGODB_URI` en `.env.local`; la conexión anterior se migró a este archivo local y ya no hay una contraseña de respaldo en `server.js`.
3. En la instancia de Clerk, habilita **Authenticator application (TOTP)** y **Backup codes** en **Multi-factor**. Selecciona **Invite-only** en **Access mode** para cerrar también la creación pública de cuentas. Son ajustes de la instancia del proveedor; la aplicación no puede activarlos sin credenciales administrativas. El código bloquea el panel a cuentas sin autorización incluso si la instancia permite registros públicos.
4. Identifica tu cuenta existente por su ID `user_…` y su correo verificado. Autoriza únicamente esa cuenta desde la terminal local:

   ```bash
   pnpm bootstrap:superadmin user_TU_ID tu-correo@empresa.com
   ```

   El ID y el correo deben corresponder a la misma cuenta. El script no tiene endpoint público, no asigna permisos por ser el primer visitante y no desactiva MFA. Conserva el acceso a esta operación local para recuperación administrativa.
5. Reinicia el backend (`pnpm dev:server`) y el frontend (`pnpm dev`). Entra a `/admin`: si eres superadmin, configura tu autenticador, guarda los códigos de recuperación y verifica un código nuevo. Entonces aparecerá **Usuarios y accesos** en el menú Sistema.

Después de esa configuración, las invitaciones y los permisos se administran desde la plataforma. Para invitar se usa Clerk Backend API; no se envían claves secretas al navegador. Las invitaciones duran 7 días y su destino se fija en el servidor. Si la persona ya tiene una cuenta, autorízala desde la tabla en lugar de invitarla de nuevo.

## Controles implementados

- Se verifica firma, caducidad y origen del token de sesión con el SDK de Clerk. Se consulta que la sesión siga activa y que el usuario tenga acceso vigente en cada solicitud privada; no se aceptan sesiones de suplantación.
- Los permisos se leen desde `private_metadata.fabricAccess`; las invitaciones aportan inicialmente `public_metadata.fabricAccess`, que Clerk copia al aceptar la invitación. Solo el servidor escribe esos campos. Un bloqueo privado siempre tiene prioridad. Se exige que el correo autorizado siga verificado en la cuenta. No se confía en `unsafe_metadata`, roles enviados por el navegador ni el rol predeterminado anterior.
- Todos los superadmin necesitan TOTP configurado y una segunda verificación de menos de 15 minutos (`fva` del token firmado). La ruta `/api/auth/login` solo permite consultar el estado y llegar a la configuración de MFA: no concede acceso a los datos. Si no hay `fva` (por ejemplo, un token antiguo), se bloquean las operaciones: usa tokens de sesión v2 y vuelve a iniciar sesión.
- Bloquear o cambiar permisos afecta a la siguiente solicitud aunque el usuario conserve un JWT firmado. La aplicación no puede retirar datos que el usuario ya descargó.
- Si falta la configuración o falla Clerk, las operaciones privadas se rechazan. Se quitaron los accesos de respaldo del frontend y el falso `admin` del backend.
- Una lista explícita mantiene públicas las operaciones de formularios y catálogos del sitio. Las operaciones privadas y sus alias antiguos, las cargas y las descargas exigen autorización antes de acceder a MongoDB. Los cambios de acceso emiten eventos estructurados de auditoría en los logs del servidor, sin secretos ni tickets de invitación.

## Alcance y comprobación

`pnpm test:access` prueba tokens falsificados y caducados, origen incorrecto, ausencia de configuración, cuentas sin permiso, sesiones revocadas, roles de admin/superadmin, exigencia de MFA, invitaciones, bloqueos y alias privados. Las pruebas usan firmas RSA reales y simulan únicamente las respuestas de la API de identidad; no envían correos reales ni alteran cuentas reales.

Validación local del cambio: 15 pruebas de acceso aprobadas (incluida la autorización inicial por correo verificado) y compilación Vite de producción aprobada. El chequeo TypeScript de los módulos de acceso, MFA, gestión de usuarios, layout y descargas pasa. El chequeo TypeScript global sigue reportando errores en otros módulos existentes (entre ellos `InteractionManager`, `entry-server` y páginas de videollamada); no se presenta como aprobado. No se completó una prueba visual ni una sesión real de Clerk porque falta la clave secreta y la configuración de la instancia.

La integración de Clerk real (correo de invitación, aceptación, alta de TOTP y recuperación) necesita la configuración anterior y una prueba con dos cuentas controladas antes de publicar. Prueba también el rol admin intentando llamar directamente a `/api/access/users`: debe recibir 403.

El transporte público de videollamadas y sus PIN existentes conservan su protocolo anterior; no forma parte de este cambio de accesos al panel. Las rutas antiguas de lectura/edición de evaluaciones individuales ahora exigen autorización: si necesitas reanudación pública de evaluaciones, implementa un enlace con un token de acceso específico antes de volver a exponerlas.

La contraseña de MongoDB anteriormente incluida en el código y en `env.txt` debe rotarse en el proveedor: eliminarla del código actual no elimina copias históricas de Git. Se preservó la configuración local en `.env.local` para evitar perder la conexión durante la migración.

Referencias oficiales: [restricción de registros](https://clerk.com/docs/guides/secure/restricting-access), [configuración de MFA](https://clerk.com/docs/guides/development/custom-flows/account-updates/manage-mfa), [claims de sesión](https://clerk.com/docs/guides/sessions/session-tokens).
