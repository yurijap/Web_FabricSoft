# Usuarios y accesos

El panel **Sistema → Usuarios y accesos** (`/admin/usuarios`) permite al superadmin invitar, revocar invitaciones, cambiar entre `admin` y `superadmin`, retirar o restablecer accesos y eliminar cuentas del equipo. Un admin opera la consola pero no administra accesos. La cuenta actual no puede bloquearse, eliminarse ni cambiar su propio rol.

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

Después de esa configuración, las invitaciones y los permisos del equipo se administran desde la plataforma. Las invitaciones duran 7 días y su destino se fija en el servidor. **Enviar la invitación ya autoriza el rol elegido: aceptarla activa el acceso sin otra aprobación.**

## Usar el directorio y elegir el correo

### Alta de Julio al desplegar

Por autorización expresa del propietario, el build de **Vercel Production** prepara `julio.alvarez@fabricsoft.com.mx` con rol `superadmin` y contraseña. Se ejecuta al terminar la compilación y el prerender mediante `scripts/provision-production-superadmin.mjs`; `vercel.json` fija `pnpm run build`. Desarrollo local, Preview y entornos personalizados omiten esta operación. Se utilizan `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` y `MONGODB_URI` ya configuradas en Production; no hace falta copiar la clave secreta al equipo local para este flujo.

El script comprueba que las claves de firma pública de las dos API de Clerk coincidan antes de tocar cuentas. Solo prepara ese correo exacto. Si la cuenta ya existe, exige que sea su dirección principal verificada y que no esté suspendida/bloqueada en Clerk; conserva sus demás metadatos y cierra sus sesiones anteriores al asignar las credenciales. La cuenta nueva se crea mediante la API administrativa de Clerk, que verifica sus identificadores por defecto. El propietario debe entregar las credenciales a Julio.

La contraseña se genera aleatoriamente; el repositorio contiene únicamente un hash PBKDF2-SHA256 con sal aleatoria y 600 000 iteraciones, en un módulo exclusivo del build. No se incluye en el frontend ni se imprime en los logs. Clerk admite importar este formato de contraseña. El modo de acceso por contraseña debe estar habilitado en esa instancia; un rechazo de Clerk o una configuración incompleta detiene el build con un mensaje seguro.

La colección `fabric_admin_provisioning` guarda un recibo por instancia de Clerk y versión del alta. Usa un bloqueo temporal para impedir ejecuciones simultáneas. Los posteriores despliegues no restablecen contraseñas, no revierten cambios de rol ni retiradas de acceso, y no recrean cuentas eliminadas. Esta colección no forma parte del vaciado de datos operativos. La recuperación de un build interrumpido consulta la identidad ya conocida o su recibo privado en Clerk; si no puede distinguir un alta incierta de una eliminación, detiene el proceso para revisión en lugar de recrearla.

`pnpm test:production-setup` prueba el alta y actualización, omisión fuera de producción, correspondencia de claves, fallos y reintentos, preservación de decisiones posteriores, eliminación y concurrencia con servicios simulados. La creación real se comprobará en los logs del despliegue; aquí no se dispone de la clave administrativa. Referencias: [importación de contraseñas en Clerk](https://clerk.com/docs/reference/backend/user/create-user), [actualización de cuentas](https://clerk.com/docs/reference/backend/user/update-user), [variables del sistema de Vercel](https://vercel.com/docs/environment-variables/system-environment-variables).

### Directorio y correo autorizado

La pantalla abre directamente en **Equipo**, con búsqueda por nombre o correo entre sus miembros en todas las páginas. **Pendientes** contiene las invitaciones aún sin aceptar. **Invitar usuario** elige el rol antes de enviar. Al aceptar, la cuenta aparece **Activa**. **Gestionar acceso** permite cambiar su rol, **Quitar acceso** o **Restablecer acceso** después de retirarlo; no es una segunda aprobación de la invitación. **Roles y ayuda** muestra la explicación cuando se necesita. Las cuentas que nunca recibieron un rol se ocultan del directorio.

- **Cualquier proveedor:** Gmail, Outlook, Hotmail y los correos corporativos sirven. La persona debe poder recibir mensajes en esa dirección y verificarla. En Clerk, el método de inicio de sesión por correo debe estar habilitado en **User & authentication**; cambiar el diseño no modifica esa configuración externa ni las claves.
- **Si aún no tiene cuenta:** invita a su dirección real y que abra el enlace de ese buzón para crear su cuenta. Al aceptar, recibe automáticamente el rol seleccionado, asociado a su correo verificado. No debes pulsar otro botón para darle acceso.
- **Si ya aceptó:** puede entrar directamente. **Gestionar acceso** sirve para cambiarle el rol o retirar su permiso.
- **Cuenta del equipo:** la ventana de gestión muestra su correo principal y si está verificado. El servidor vuelve a comprobarlo al guardar; si la dirección cambió desde que abriste la lista, exige actualizarla antes de autorizar ese correo.
- **Si inicia sesión con otra cuenta:** no hereda los permisos. Debe entrar con la cuenta autorizada o recibir una autorización independiente. Google es una opción para cuentas de Google; un correo de Outlook o corporativo puede entrar por el método de correo configurado en Clerk.
- **Si cambia el correo de la misma cuenta:** el autorizado debe seguir presente y verificado. Si lo elimina o deja de estar verificado, pierde el acceso aunque conserve su rol asignado. El superadmin puede revisar y autorizar su nuevo correo principal verificado. La ventana distingue el correo autorizado anteriormente del actual.
- **Sin correo verificado:** no se puede dar acceso. Sí se puede bloquear o eliminar la cuenta. Un bloqueo no depende de que conserve el correo anterior, y tiene prioridad sobre el permiso de una invitación.

El servidor vincula los permisos a la cuenta de Clerk y al correo aprobado; no limita dominios a Gmail ni concede acceso por compartir dominio con una empresa. La vista de búsqueda cuenta solo miembros del equipo y no expone metadatos privados.

### Activación automática y retirada posterior

En el primer login, el servidor persiste el permiso de la invitación en `private_metadata.fabricInvitationAccess`. Si Clerk no copió los metadatos a la cuenta, consulta sus invitaciones **aceptadas** y comprueba correo exacto y verificado, rol, autor del permiso y fechas de creación/aceptación. No basta con que exista una invitación pendiente o con presentar un ticket en el navegador. Para recuperar permisos sin los metadatos copiados, la creación de la cuenta debe corresponder al intervalo de la invitación; un registro posterior con el mismo correo no reutiliza una invitación de una cuenta eliminada. El directorio también reconcilia las invitaciones aceptadas para corregir cuentas que antes aparecían sin acceso, sin una nueva aprobación manual.

Las decisiones del superadmin se guardan en `private_metadata.fabricAccess`, que siempre tiene prioridad sobre el permiso automático. **Quitar acceso** guarda `status: blocked`, conserva la cuenta y deniega sus siguientes solicitudes. Ni volver a entrar ni abrir el enlace anterior restaura ese acceso. **Restablecer acceso** es una decisión explícita del superadmin. La activación automática escribe otra clave para que tampoco pueda sobrescribir una retirada o un cambio de rol concurrente.

### Al abrir una invitación con una sesión anterior

Clerk puede redirigir su formulario de registro si ya existe una sesión. Para evitar que se pierda el flujo de invitación, `/crear-cuenta` espera a que cargue Clerk y, si hay una sesión, muestra su correo y **Cerrar sesión y continuar invitación** antes de montar el formulario. El cierre es explícito y conserva la ruta, el ticket y los parámetros originales del enlace. No se guarda el ticket en almacenamiento del navegador ni se conceden permisos desde el cliente.

Si ya se llegó a **Acceso restringido**, la pantalla muestra el correo conectado. Cierra esa sesión y vuelve a abrir el enlace original del correo, o ábrelo en una ventana privada sin sesión. Si sigue fallando con la cuenta correcta, el superadmin debe comprobar su estado en Usuarios; una invitación no debe sobrescribir un bloqueo privado.

El correo puede venir ya rellenado y verificado por la invitación. La contraseña solo se solicita si ese método está habilitado en la instancia de Clerk. La ausencia de un campo de contraseña no demuestra un fallo, pero el mensaje **Sin acceso autorizado** sí indica que la cuenta de la sesión no superó la comprobación de permisos.

Referencias: [comportamiento de SignUp con una sesión abierta](https://clerk.com/docs/react/reference/components/authentication/sign-up), [verificación de correo mediante invitaciones](https://clerk.com/docs/guides/users/inviting).

### Regreso de Google e inicio sin invitación

`ClerkProvider` fija las rutas `/acceso` y `/crear-cuenta`, y tanto el destino obligatorio como el alternativo de los dos flujos apuntan a `/admin`. Los componentes también configuran el destino del flujo contrario, porque Google puede convertir un intento de iniciar sesión en un registro. Una sesión ya abierta en `/acceso` pasa a la comprobación de permisos; no deja que el formulario la envíe al Home URL de Clerk. La ruta antigua `/verificar-acceso` utiliza el mismo flujo.

Como compatibilidad con enlaces anteriores que regresaban al inicio, un retorno con ticket de invitación se lleva a `/crear-cuenta` y un retorno de sincronización del navegador de desarrollo a `/acceso`, conservando los parámetros para que los procese el SDK. No se decodifican ni se usan como prueba de identidad. Las visitas públicas normales mantienen la portada y no cargan Clerk. El flujo normal de producción utiliza los destinos configurados y no depende de parámetros internos de desarrollo.

Autenticarse con Google **no autoriza el acceso administrativo**. Si el correo no fue invitado ni autorizado, permanece en `/admin` con **Acceso restringido**, una explicación y el correo conectado. Los permisos y errores del contexto se asocian a la sesión actual para no mostrar el resultado de otra cuenta durante un cambio de sesión. Una respuesta de permisos correspondiente a otro usuario se rechaza.

El parámetro de sincronización `__clerk_db_jwt` de las capturas pertenece a las instancias **Development**. Para producción, configura las claves pública y secreta de la misma instancia **Production** en Vercel. Las cuentas y sus permisos pertenecen a cada instancia; cambiar las claves requiere preparar las cuentas de destino. Esta corrección no cambia automáticamente las claves ni migra usuarios.

Verificación: `pnpm test:auth-routing` comprueba destinos, conservación del retorno, visitas públicas, ausencia de bucles y rechazo de destinos controlados por la URL. Referencias: [destinos de Clerk](https://clerk.com/docs/guides/development/customize-redirect-urls), [diferencias entre instancias](https://clerk.com/docs/guides/development/managing-environments).

### Directorio del equipo

La pestaña **Equipo** muestra solo cuentas con un rol Admin o Superadmin asignado, incluidas las que tienen el acceso retirado o necesitan revisar su correo. Las identidades que nunca recibieron permisos se ocultan de esta vista; las invitaciones sin aceptar siguen en **Pendientes**. El filtro es visual: no elimina identidades de Clerk ni modifica los permisos del servidor.

El contador, la búsqueda y la paginación corresponden solo al equipo. El cliente recorre las páginas de la API existente antes de filtrar y paginar los miembros, para encontrar también a los autorizados que estén detrás de cuentas ocultas. Al quitar acceso, la persona sigue visible para poder restablecerlo. `pnpm test:team-directory` verifica estos filtros y el recorrido de páginas.

## Controles implementados

- Se verifica firma, caducidad y origen del token con el SDK de Clerk. Se consulta que la sesión siga activa y que el usuario tenga acceso vigente en cada solicitud privada; no se aceptan sesiones de suplantación.
- Los permisos se leen en este orden: decisión manual en `private_metadata.fabricAccess`, activación persistida en `private_metadata.fabricInvitationAccess`, metadatos de invitación copiados por Clerk en `public_metadata.fabricAccess`. Una decisión privada vacía o inválida también impide recurrir a una invitación anterior. Solo el servidor escribe esos permisos. Se exige que el correo autorizado siga verificado. No se confía en `unsafe_metadata`, roles enviados por el navegador ni roles predeterminados.
- Superadmin puede gestionar accesos sin configurar un segundo factor. Admin no puede gestionar usuarios ni vaciar la base de datos. Tener sesión no concede permisos por sí solo.
- Bloquear o cambiar permisos afecta a la siguiente solicitud aunque el usuario conserve un JWT firmado. No se pueden retirar datos que ya haya descargado.
- Si falta la configuración o falla Clerk, las operaciones privadas se rechazan.
- Una lista explícita mantiene públicos los formularios y catálogos del sitio. Las operaciones privadas y sus alias antiguos, las cargas y las descargas exigen autorización antes de acceder a MongoDB.
- Los cambios de acceso emiten eventos de auditoría en los logs del servidor, sin secretos ni tickets de invitación.

## Eliminar o bloquear una cuenta

- **Quitar acceso** conserva la cuenta y permite restablecerla explícitamente. La siguiente solicitud privada queda denegada, aunque conserve una invitación aceptada.
- **Eliminar cuenta** borra permanentemente su identidad de acceso en Clerk y la retira de la lista. Funciona con cuentas activas, bloqueadas o sin acceso. Los leads, citas y documentos de MongoDB se conservan.
- Solo superadmin puede eliminar. El servidor rechaza la eliminación de la cuenta actual y exige escribir el correo principal actual del usuario; si no tiene correo, su identificador. Los errores del proveedor se muestran sin dar por eliminada la cuenta.
- La lista y su total se actualizan después de la eliminación. Al borrar el último usuario de una página, se vuelve a la anterior. El evento `access.deleted` registra actor y cuenta eliminada, sin credenciales.
- Eliminar no bloquea por sí solo futuros registros con el mismo correo. El modo Invite-only controla la creación de cuentas; los usuarios nuevos siguen necesitando autorización.

## Verificación y alcance

`pnpm test:access` comprueba tokens falsificados y caducados, origen incorrecto, ausencia de configuración, cuentas sin permiso, sesiones revocadas, separación de roles, acceso de superadmin sin segundo factor, aceptación y activación automática, recuperación de metadatos, retirada posterior, carreras con cambios manuales, fallos del proveedor, eliminación de cuentas y alias privados. Las pruebas usan firmas RSA reales y simulan las respuestas de la API de identidad; no envían correos ni alteran cuentas reales.

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
