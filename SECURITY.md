# Política de seguridad

Gracias por ayudar a mantener segura esta aplicación.

## Cómo reportar una vulnerabilidad

**No abras un *issue* público** para problemas de seguridad. Usa el reporte privado
de GitHub:

1. Entra en <https://github.com/jaervic/budgetify/security/advisories/new>
2. Describe el problema, cómo reproducirlo y su impacto.

Recibirás respuesta lo antes posible. Una vez corregido, se publicará el aviso.

## Alcance y modelo de seguridad

Por defecto esta aplicación **no tiene backend, ni cuentas, ni sesiones, ni
servidores**. Todo el cálculo y el almacenamiento ocurren en el navegador de cada
persona:

- Los datos (borrador, catálogo, datos de la clínica) se guardan en el **`localStorage`
  del propio navegador**. No se envían a ningún servidor.
- La única conexión externa es un `GET` a la API pública de la tasa del BCV
  (`https://ve.dolarapi.com`), que no lleva datos del usuario.
- No hay analítica, rastreadores ni cookies de terceros.

### Sincronización opcional

La app permite **activar una cuenta** para sincronizar entre equipos. Es una función
opt-in: si nadie inicia sesión, el modelo anterior no cambia. Cuando se activa:

- La identidad se gestiona con **Supabase Auth**. Se puede entrar con **correo y
  contraseña** o con un **enlace mágico** por correo. La contraseña la almacena Supabase
  como hash; **la app nunca la guarda ni la escribe en `localStorage`**.
- Los correos de acceso y de recuperación salen por el **SMTP configurado en Supabase**
  (por ejemplo, Gmail). Las credenciales SMTP viven solo en Supabase, nunca en el cliente.
- Los datos viajan por **HTTPS** y Supabase los guarda **cifrados en reposo**.
- Cada fila de `profiles`, `documents` y `drafts` está protegida con **Row Level
  Security (RLS)**: `auth.uid() = user_id`. Un usuario autenticado no puede leer,
  insertar, actualizar ni borrar filas de otro.
- El cliente usa solo la **clave anónima** de Supabase. La `service_role` vive
  únicamente en la Edge Function `delete-account`.
- **No es cifrado de extremo a extremo**: el proveedor puede acceder técnicamente a los
  datos. La privacidad se apoya en el aislamiento por usuario, el cifrado gestionado y
  el control de acceso, no en una clave que solo tenga el usuario.
- El token de sesión de Supabase se guarda en `localStorage` (como el resto del estado),
  así que un XSS sigue siendo el riesgo principal. La CSP y la ausencia de
  `dangerouslySetInnerHTML` lo mitigan.

## Vulnerabilidades relevantes

- **XSS** (que un script inyectado pudiera leer el `localStorage` o la sesión).
- **CSRF/clickjacking** (mitigado con CSP `frame-ancestors` y `X-Frame-Options`).
- **Dependencias** comprometidas o desactualizadas.
- **Fallo de RLS o de la Edge Function** que permita acceder a datos de otra cuenta.
- **Filtración de la `service_role`** (nunca debe estar en el bundle del cliente).
- **Fuerza bruta o credential stuffing** contra el login con contraseña (mitigado con
  límites de intentos, longitud mínima y, opcionalmente, CAPTCHA de Supabase).
- **Robo de la contraseña** por reutilización en otros sitios; recomienda una contraseña
  única y un gestor de contraseñas.

## Medidas aplicadas

- **Content-Security-Policy estricta** sin `unsafe-inline` ni `unsafe-eval` en scripts
  (ver `vercel.json`). Solo se permite WebAssembly (`'wasm-unsafe-eval'`), que necesita
  la librería que arma el PDF, `data:` en `connect-src` porque esa misma librería carga
  su módulo desde una URL de datos (inerte: no puede salir a la red), y
  `https://*.supabase.co` / `wss://*.supabase.co` para la cuenta opcional.
- Cabeceras `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` y `Cross-Origin-Resource-Policy`.
- **Validación con Zod** de todo archivo importado y de todo dato que llega de la nube,
  con límites de tamaño y longitud. Las imágenes solo se aceptan como
  `data:image/(png|jpeg|webp);base64,…`.
- **Contraseñas**: mínimo 8 caracteres en la app, política de Supabase Auth y límites de
  intentos. La recuperación se hace con un enlace enviado por el SMTP configurado. Si se
  desactiva la confirmación por correo, el correo funciona como identificador y no como
  prueba de propiedad; el acceso sigue protegido por la contraseña y RLS.
- **RLS por usuario** y límites de tamaño en la base de datos, con una guía de
  verificación con dos cuentas en [`supabase/README.md`](supabase/README.md).
- Sin `eval`, sin `new Function` y sin `dangerouslySetInnerHTML`.
- `npm audit --audit-level=high` en el CI y actualizaciones automáticas con Dependabot.
- **Borrado de cuenta** desde la app: elimina el usuario de Auth y, por cascada, sus
  perfiles, documentos y borradores. El borrado local es independiente.

## Aviso para equipos compartidos

Como los datos viven en el navegador, **en una computadora compartida otra persona que
use el mismo perfil del navegador podría ver el borrador**. Si además hay una cuenta:

- Al cerrar sesión, marca **«Borrar también los datos guardados en este equipo»**.
- Si otra persona inicia sesión en un equipo que tenía datos de una cuenta anterior, la
  app **no los sube automáticamente**: pregunta si combinarlos o descartarlos.
- Si no usas cuenta, pulsa **Limpiar** al terminar o abre la app en una ventana de
  incógnito.

## Alcance de la demo pública

La demo en `budgetify-silk.vercel.app` se despliega con `VITE_SYNC_ENABLED=false`: no
muestra la cuenta ni envía datos a Supabase. No introduzcas datos reales de pacientes en
la demo. Para usar la sincronización, despliega tu propia instancia siguiendo
[la documentación técnica](docs/DESARROLLO.md) y adapta la
[plantilla de política de privacidad](docs/PRIVACIDAD.md).
