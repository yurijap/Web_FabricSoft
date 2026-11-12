# Usuarios y accesos

El panel **Sistema → Usuarios y accesos** (`/admin/usuarios`) permite al superadmin invitar, revocar invitaciones, autorizar cuentas existentes, cambiar entre `admin` y `superadmin`, bloquear el acceso y eliminar cuentas. Un admin opera la consola pero no administra accesos. La cuenta actual no puede bloquearse, eliminarse ni cambiar su propio rol.

Por solicitud del propietario, **la aplicación ya no exige MFA**. No se necesita configurar un autenticador ni códigos de recuperación para entrar al panel. Se mantienen la verificación de sesión de Clerk, los correos verificados y los permisos comprobados en el servidor. La respuesta de login incluye `mfaRequired: false` por compatibilidad con clientes anteriores.

## Configuración inicial

1. En **`.env.local`**, configura `CLERK_SECRET_KEY` de la misma aplicación e instancia que `VITE_CLERK_PUBLISHABLE_KEY`. Esta clave es exclusiva del servidor. `.env` y `env.txt` ya estaban versionados: no pongas secretos en esos archivos. El backend y el script leen primero `.env.local`, sin sobrescribir variables del entorno.
2. En desarrollo, configura `APP_ORIGIN=https://localhost:5173` y `CLERK_AUTHORIZED_PARTIES=https://localhost:5173`. En Vercel o con `NODE_ENV=production`, los valores por defecto autorizan `https://fabricsoft.com.mx` y `https://www.fabricsoft.com.mx`. Las variables explícitas tienen prioridad: si ya existen en Vercel, deben indicar el dominio real y no localhost. Configura también `MONGODB_URI`.
3. En Clerk, puedes dejar **Authenticator application**, **Backup codes** y **Require multi-factor authentication** desactivados. Selecciona **Invite-only** en **Access mode** para cerrar la creación pública de cuentas. Invita a la primera cuenta desde la sección de usuarios de la aplicación. Si una cuenta ya tiene MFA configurado en Clerk, los requisitos del proveedor durante su inicio de sesión se gestionan en Clerk: este cambio no modifica las cuentas del proveedor.
4. Cuenta inicial autorizada: **`edilbertoh369@gmail.com`**. Después de desplegar los cambios, entra a `/acceso` con esa cuenta. El backend comprueba que sea su correo principal verificado y guarda el rol `superadmin` la primera vez. La asignación no se repite si la cuenta ya tiene un registro privado de acceso: bloqueos y cambios de rol posteriores se respetan.
5. Inicia sesión para entrar a `/admin` y abre **Sistema → Usuarios y accesos**. Para probar localmente, reinicia el backend (`pnpm dev:server`) y el frontend (`pnpm dev`).

La instancia de Clerk usada por Vercel debe tener las claves correspondientes y los orígenes correctos. Los cambios locales no alteran las variables ni las cuentas de Vercel. Cambiar de instancia de Clerk requiere crear o invitar al usuario en esa instancia.

Para configurar otra instalación desde cero o recuperar la administración desde una terminal controlada:

```bash
pnpm bootstrap:superadmin user_TU_ID tu-correo@empresa.com
```

El ID y el correo verificado deben corresponder a la misma cuenta. El script no tiene endpoint público ni asigna permisos por ser el primer visitante.

Después de esa configuración, las invitaciones y los permisos se administran desde la plataforma. Las invitaciones duran 7 días y su destino se fija en el servidor. Si la persona ya tiene cuenta, autorízala desde la tabla.

## Usar el directorio y elegir el correo

La pantalla abre directamente en **Usuarios**, con búsqueda por nombre o correo en todas las páginas. **Pendientes** contiene las invitaciones. **Invitar usuario** abre un formulario breve y **Gestionar acceso** permite elegir el rol, guardar o bloquear. **Roles y ayuda** muestra los permisos y la explicación del acceso cuando se necesita. Una cuenta sin rol aparece como **Sin rol / Sin acceso**; seleccionar Admin en el formulario no concede permisos hasta guardar.

- **Cualquier proveedor:** Gmail, Outlook, Hotmail y los correos corporativos sirven. La persona debe poder recibir mensajes en esa dirección y verificarla. En Clerk, el método de inicio de sesión por correo debe estar habilitado en **User & authentication**; cambiar el diseño no modifica esa configuración externa ni las claves.
- **Si aún no tiene cuenta:** invita a su dirección real y que abra el enlace de ese buzón para crear su cuenta. El permiso de la invitación queda asociado al correo verificado de esa cuenta.
- **Si ya tiene cuenta:** búscala y abre **Gestionar acceso**. La ventana muestra su correo principal y si está verificado. El servidor vuelve a comprobarlo al guardar; si la dirección cambió desde que abriste la lista, exige actualizarla antes de autorizar.
- **Si inicia sesión con otra cuenta:** no hereda los permisos. Debe entrar con la cuenta autorizada o recibir una autorización independiente. Google es una opción para cuentas de Google; un correo de Outlook o corporativo puede entrar por el método de correo configurado en Clerk.
- **Si cambia el correo de la misma cuenta:** el autorizado debe seguir presente y verificado. Si lo elimina o deja de estar verificado, pierde el acceso aunque conserve su rol asignado. El superadmin puede revisar y autorizar su nuevo correo principal verificado. La ventana distingue el correo autorizado anteriormente del actual.
- **Sin correo verificado:** no se puede dar acceso. Sí se puede bloquear o eliminar la cuenta. Un bloqueo no depende de que conserve el correo anterior, y tiene prioridad sobre el permiso de una invitación.

El servidor vincula los permisos a la cuenta de Clerk y al correo aprobado; no limita dominios a Gmail ni concede acceso por compartir dominio con una empresa. La búsqueda devuelve un total filtrado y no expone metadatos privados.

## Controles implementados

- Se verifica firma, caducidad y origen del token con el SDK de Clerk. Se consulta que la sesión siga activa y que el usuario tenga acceso vigente en cada solicitud privada; no se aceptan sesiones de suplantación.
- Los permisos se leen desde `private_metadata.fabricAccess`; las invitaciones aportan inicialmente `public_metadata.fabricAccess`, que Clerk copia al aceptarlas. Solo el servidor escribe esos campos. Un bloqueo privado tiene prioridad. Se exige que el correo autorizado siga verificado. No se confía en `unsafe_metadata`, roles enviados por el navegador ni roles predeterminados.
- Superadmin puede gestionar accesos sin configurar un segundo factor. Admin no puede gestionar usuarios ni vaciar la base de datos. Tener sesión no concede permisos por sí solo.
- Bloquear o cambiar permisos afecta a la siguiente solicitud aunque el usuario conserve un JWT firmado. No se pueden retirar datos que ya haya descargado.
- Si falta la configuración o falla Clerk, las operaciones privadas se rechazan.
- Una lista explícita mantiene públicos los formularios y catálogos del sitio. Las operaciones privadas y sus alias antiguos, las cargas y las descargas exigen autorización antes de acceder a MongoDB.
- Los cambios de acceso emiten eventos de auditoría en los logs del servidor, sin secretos ni tickets de invitación.

## Eliminar o bloquear una cuenta

- **Bloquear** conserva la cuenta y permite reactivarla. La siguiente solicitud privada queda denegada.
- **Eliminar cuenta** borra permanentemente su identidad de acceso en Clerk y la retira de la lista. Funciona con cuentas activas, bloqueadas o sin acceso. Los leads, citas y documentos de MongoDB se conservan.
- Solo superadmin puede eliminar. El servidor rechaza la eliminación de la cuenta actual y exige escribir el correo principal actual del usuario; si no tiene correo, su identificador. Los errores del proveedor se muestran sin dar por eliminada la cuenta.
- La lista y su total se actualizan después de la eliminación. Al borrar el último usuario de una página, se vuelve a la anterior. El evento `access.deleted` registra actor y cuenta eliminada, sin credenciales.
- Eliminar no bloquea por sí solo futuros registros con el mismo correo. El modo Invite-only controla la creación de cuentas; los usuarios nuevos siguen necesitando autorización.

## Verificación y alcance

`pnpm test:access` comprueba tokens falsificados y caducados, origen incorrecto, ausencia de configuración, cuentas sin permiso, sesiones revocadas, separación de roles, acceso de superadmin sin segundo factor, invitaciones, bloqueos, eliminación de cuentas y alias privados. Las pruebas usan firmas RSA reales y simulan las respuestas de la API de identidad; no envían correos ni alteran cuentas reales.

La integración real de Clerk necesita las claves y una prueba con cuentas controladas antes de publicar. El rol admin debe recibir 403 al llamar directamente a `/api/access/users`. El chequeo TypeScript global del repositorio tenía errores en otros módulos existentes; no se considera aprobado por validar únicamente los módulos de acceso.

El transporte público de videollamadas y sus PIN conservan su protocolo anterior. Las rutas antiguas de lectura/edición de evaluaciones individuales exigen autorización: una reanudación pública necesita un enlace con un token específico antes de volver a exponerlas.

La contraseña de MongoDB anteriormente incluida en el código y en `env.txt` debe rotarse en el proveedor: eliminarla del código actual no elimina copias históricas de Git. La configuración local se preservó en `.env.local`.

## Si aparece «La sesión es inválida o ha expirado»

Ese error ocurre antes de comprobar el correo o asignar el rol. Despliega la corrección de orígenes de producción, cierra sesión y vuelve a entrar.

Si el backend devuelve `AUTH_ORIGIN_NOT_ALLOWED`, revisa las variables existentes en Vercel:

```env
APP_ORIGIN=https://fabricsoft.com.mx
CLERK_AUTHORIZED_PARTIES=https://fabricsoft.com.mx,https://www.fabricsoft.com.mx
```

Después de modificar variables, vuelve a desplegar. Si persiste `INVALID_SESSION`, comprueba que `CLERK_SECRET_KEY` y `VITE_CLERK_PUBLISHABLE_KEY` correspondan a la misma instancia. Los logs registran `access.session_rejected` con una categoría segura, sin tokens.

Referencias: [restricción de registros](https://clerk.com/docs/guides/secure/restricting-access), [validación de sesiones](https://clerk.com/docs/reference/backend/verify-token), [eliminación de usuarios](https://clerk.com/docs/reference/backend/user/delete-user), [búsqueda de usuarios](https://clerk.com/docs/reference/backend/user/get-user-list), [conteo filtrado](https://clerk.com/docs/reference/backend/user/get-count), [opciones de inicio de sesión](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options).
