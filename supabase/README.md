# Sincronización con Supabase

Esta carpeta contiene todo lo necesario para la **cuenta opcional**. Sin estas
credenciales la app funciona igual que siempre: local, offline y sin servidores.

## 1. Crear el proyecto

1. Crea un proyecto en <https://supabase.com>.
2. Elige una región cercana a tus usuarios (por ejemplo, `us-east-1` o
   `eu-central-1`).
3. Copia `Project URL` y `anon public key` desde **Project Settings → API**.

No uses la `service_role` en el frontend: solo la Edge Function la necesita y
Supabase la inyecta como variable de entorno.

## 2. Aplicar el esquema

Con la CLI de Supabase:

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

O pega el contenido de `migrations/202610230001_sync.sql` en el **SQL Editor** y
ejecútalo. El script crea:

- `profiles`: empresa, catálogo y preferencias.
- `documents`: historial (una fila por presupuesto/cotización).
- `drafts`: borrador en curso por modalidad.
- Trigger `touch_sync_row`: pone `updated_at` en el servidor y sube `rev`.
- Políticas RLS `auth.uid() = user_id` en las tres tablas.
- Límites de tamaño por fila.

## 3. Desplegar el borrado de cuenta

```bash
supabase functions deploy delete-account
```

La función verifica el JWT del usuario y usa `service_role` para borrar el
usuario de Auth. Las filas se borran por `on delete cascade`.

Si no despliegas esta función, el botón **Borrar mi cuenta** fallará (el resto de
la sincronización seguirá funcionando).

## 4. Configurar Auth

La app admite **correo + contraseña** y **enlace mágico**. Ambas formas crean la misma
sesión de Supabase.

### URL Configuration

En **Authentication → URL Configuration**:

- **Site URL**: el dominio de la app real (por ejemplo,
  `https://app.tudominio.com`).
- **Redirect URLs**: añade también `http://localhost:5173` para desarrollo.
- La recuperación de contraseña usa el mismo redirect. Si usas un dominio de preview de
  Vercel, añade esa URL exacta.

### Email provider

En **Authentication → Providers → Email**:

- Debe estar **activado** (lo está por defecto).
- **Confirm email**:
  - **Desactivado** si quieres que el registro con contraseña funcione sin enviar
    correos. El correo es solo el identificador de la cuenta.
  - **Activado** si prefieres verificar la propiedad del correo; el registro enviará un
    correo de confirmación por el SMTP configurado.
- **Minimum password length**: 8 o más. La app valida 8 en el registro y al cambiar la
  contraseña.
- Revisa los límites en **Authentication → Rate Limits**.

### SMTP

El correo integrado de Supabase **no sirve para usuarios reales**: solo entrega a
miembros del equipo y permite 2 mensajes por hora. Configura un SMTP propio en
**Authentication → Emails → SMTP Settings**.

Opción sin dominio propio: **Gmail SMTP**.

- Cuenta de Google con verificación en dos pasos.
- **Contraseñas de aplicaciones** → crear una para “Correo”.
- Host: `smtp.gmail.com`
- Puerto: `465` (SSL) o `587` (TLS)
- Usuario: el Gmail completo
- Contraseña: la contraseña de aplicación de 16 caracteres
- Sender email: el mismo Gmail
- Sender name: `Budgetify`

Después sube el límite de email en **Authentication → Rate Limits** (Supabase aplica
30/hora por defecto con SMTP propio). Gmail permite unas 500 direcciones al día en
cuentas gratuitas.

Para un dominio propio, Resend es la opción más sencilla: 3.000 correos/mes gratis,
verificación por DNS y sin teléfono.

### Plantillas

Revisa en **Authentication → Emails** las plantillas del enlace mágico y de recuperación.
Ponlas en español y evita imágenes o contenido promocional para no caer en spam.

## 5. Variables de entorno

En Vercel (**Settings → Environment Variables**) o en `.env.local`:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SYNC_ENABLED=true
```

Para la **demo pública**, usa otro proyecto de Vercel con:

```env
VITE_SYNC_ENABLED=false
```

Así la demo no muestra la cuenta ni envía datos a Supabase aunque tenga
credenciales. La app real y la demo pueden compartir el mismo repo.

## 6. Verificar RLS

Haz la prueba con **dos usuarios reales** (dos correos):

1. Inicia sesión como A, guarda un presupuesto y espera a que sincronice.
2. Inicia sesión como B en otro navegador.
3. B no debe ver el documento de A.
4. Desde la consola del navegador de B, intenta leer la fila de A con la clave
   anónima y el JWT de B:

```js
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
const supabase = createClient(URL, ANON_KEY)
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', '<id-de-A>')
console.log({ data, error }) // data debe ser []
```

5. Intenta insertar una fila con `user_id` de A: debe fallar por `with check`.
6. Repite con `profiles` y `drafts`.

También puedes comprobar en SQL que RLS está activo:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('profiles', 'documents', 'drafts');
```

Y que cada tabla tiene su política:

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public';
```

## 7. Comprobación funcional

- [ ] Crear cuenta con correo y contraseña.
- [ ] Crear cuenta o entrar con enlace mágico.
- [ ] Entrar en un segundo equipo con el mismo correo y contraseña.
- [ ] Cambiar la contraseña desde **Cuenta**.
- [ ] Solicitar un enlace de recuperación y establecer una contraseña nueva.
- [ ] Guardar una empresa y un presupuesto; verlos en un segundo equipo.
- [ ] Editar sin conexión y recuperar la red: los cambios se suben.
- [ ] Editar el mismo borrador en dos equipos: aparece una copia de conflicto en
      el historial, no se pierde nada.
- [ ] Borrar un documento en un equipo: desaparece en el otro.
- [ ] Cerrar sesión con «borrar datos de este equipo»: no queda nada local.
- [ ] Iniciar sesión con otra cuenta en el mismo equipo: aparece el diálogo para
      combinar o descartar, nunca sube solo los datos ajenos.
- [ ] Borrar la cuenta: desaparecen las filas y el usuario de Auth.
- [ ] La demo pública no muestra el botón de cuenta.

## 8. Operación y costos

- **Plan Free**: 500 MB de base de datos y 50.000 usuarios activos. Los proyectos
  gratuitos se **pausan tras una semana de inactividad**; para una app real usa
  **Pro ($25/mes)** o un proveedor sin pausa.
- **Backups**: verifica el plan contratado. En Pro hay backups automáticos.
- **Correo**: Resend u otro SMTP; el plan gratuito suele cubrir miles de enlaces
  al mes.
- **Tamaño**: una empresa con 3 imágenes (~0,3–1,6 MB) y 100 documentos
  (~0,5–2 MB) ronda **1–4 MB por usuario**. Con 500 MB caben unas 150–300
  personas.
- **Borrado**: al borrar la cuenta se borran las filas por cascada. Si quieres
  conservar tombstones para auditoría, cámbialo a propósito, no por accidente.
- **Límites de la app**: 100 documentos, 500 servicios/productos, 4 MB por perfil
  y 2 MB por documento. Están en la migración y en los esquemas Zod.

## 9. Notas de seguridad

- El cifrado es el gestionado por Supabase (TLS + reposo). **No es E2E**: el
  proveedor puede acceder técnicamente a los datos. No lo presentes como
  «zero-knowledge».
- La `service_role` solo debe existir en la Edge Function. Nunca en
  `VITE_*`, en el bundle ni en el repositorio.
- Las credenciales SMTP de Gmail o del proveedor viven solo en Supabase. Nunca las pongas
  en `VITE_*` ni en el frontend.
- La contraseña la guarda Supabase Auth como hash; la app nunca la almacena ni la escribe
  en `localStorage`.
- Con **Confirm email** desactivado, el correo no se verifica. Es un identificador de
  cuenta, no una prueba de propiedad; el acceso lo protege la contraseña y RLS.
- Configura una longitud mínima de contraseña y límites de intentos. Para una app pública,
  considera CAPTCHA en Supabase Auth.
- Revisa la CSP de `vercel.json` si cambias de dominio de Supabase.
- La sesión se guarda en `localStorage`; un XSS podría leerla. Mantén la CSP
  estricta y no introduzcas `dangerouslySetInnerHTML`.
