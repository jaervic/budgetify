# Documentación técnica

Guía para quien quiera **usar, modificar o desplegar** el proyecto. Si solo quieres
usar la aplicación, mira el [README](../README.md).

## 🧱 Stack

| Área | Tecnología |
| --- | --- |
| Build | Vite 8 + TypeScript 6 (`strict`) |
| UI | React 19 · Tailwind CSS 4 · shadcn/ui (Radix) |
| Estado | Zustand 5 (+ `persist` con debounce) |
| Formularios | Campos controlados + Zod 4 (valida lo guardado y lo importado) |
| Dinero | `decimal.js` (nunca `float` para cálculos) |
| PDF | `@react-pdf/renderer` (carga perezosa) |
| PWA | `vite-plugin-pwa` |
| Sync opcional | Supabase (Auth + Postgres + RLS) y `@supabase/supabase-js` |
| Tests | Vitest 5 + Testing Library + jsdom |
| Navegador | Playwright (prueba de humo y contraste) |

Sin backend por defecto. La sincronización con Supabase es **opcional**: requiere
credenciales en el build y se oculta con `VITE_SYNC_ENABLED=false`.

## 🚀 Empezar

Requisitos: Node 22 y npm.

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # build de producción (tsc + vite)
npm run preview    # sirve el build
npm test           # tests (Vitest)
npm run typecheck  # sólo comprobación de tipos
npm run lint       # oxlint
npm run icons      # regenera los iconos PWA
npm run test:e2e   # prueba de humo en Chromium (necesita `npm run build` antes)
```

## 💰 Modelo de datos y cálculo

Cada servicio tiene una **fórmula**:

| Tipo | Significado | Campos |
| --- | --- | --- |
| `fixed` | Precio fijo | `amountUsd` |
| `qty_unit` | Cantidad × precio unitario | `qty`, `unitUsd` |
| `percent_of_item` | % del monto de otro servicio | `refConcept`, `percent` |
| `percent_of_subtotal` | % del subtotal de una categoría | `category`, `percent` |

Reglas:

- **VES = USD × tasa**. Se redondea **solo al mostrar** (2 decimales); los pasos
  intermedios conservan precisión (`decimal.js`, precisión 30).
- Se **prohíbe** `eval` y `Function`: las fórmulas son datos, no código.
- Subtotales por categoría = suma de los ítems de esa categoría. Total = suma de subtotales.

### Resolución de dependencias

`percent_of_item` y `percent_of_subtotal` dependen de otros ítems. El motor
(`src/lib/calc.ts`) resuelve el grafo con detección de **dependencias circulares**:

- `percent_of_item` → busca el ítem cuyo **concepto** coincide con `refConcept`.
- `percent_of_subtotal` → base = subtotal de la categoría **excluyendo los ítems que
  también son porcentaje de esa misma categoría** (así se evita la autorreferencia).
- Si hay un ciclo o una referencia inexistente, el ítem se marca con aviso y vale `0`;
  la app **no se cuelga**.

### Ejemplo verificado (tasa 876,80)

| Concepto | USD | VES |
| --- | --- | --- |
| Cirujano Principal | $350.00 | Bs. 306.880,00 |
| Ayudante y Anestesiólogo (50%) | $175.00 | Bs. 153.440,00 |
| Circulantes (2 × $20) | $40.00 | Bs. 35.072,00 |
| **Subtotal Honorarios Médicos** | **$615.00** | **Bs. 539.232,00** |
| **Subtotal Gastos de Clínica** | **$760.00** | **Bs. 666.368,00** |
| **TOTAL GENERAL** | **$1,375.00** | **Bs. 1.205.600,00** |

Estos números son un fixture de los tests: el motor se valida contra ellos aunque el
catálogo por defecto cambie.

## 💱 Tasa del BCV

- Fuente: `https://ve.dolarapi.com/v1/dolares/oficial` (gratuita, sin clave y con
  **CORS abierto**, así que se consume desde el navegador; la app sigue siendo 100 %
  frontend). No existe un API oficial del BCV con CORS.
- Modo **auto** (ancla al BCV) o **manual**. Editar la tasa a mano la pasa a manual.
- Timeout de 8 s y **caché del último valor**: sin red se usa el valor guardado o la
  tasa manual, con aviso.

## 🗂️ Estructura

```
src/
├─ types.ts                 # Formula, Item, Budget, Catalog, Clinic…
├─ data/
│  ├─ specialties.ts        # áreas de práctica (especialidades)       ← tests
│  ├─ catalog.ts            # catálogo por defecto + migración del catálogo ← tests
│  └─ defaults.ts           # tasa, notas, clínica de ejemplo, helpers
├─ lib/
│  ├─ calc.ts               # motor de cálculo (toposort + ciclos)   ← tests
│  ├─ money.ts              # Decimal + formatters USD / VES
│  ├─ number.ts             # parseo numérico tolerante (coma/punto) ← tests
│  ├─ date.ts               # fecha larga en español                 ← tests
│  ├─ bcv.ts                # consulta de la tasa BCV                ← tests
│  ├─ catalog.ts            # filtro por área de práctica            ← tests
│  ├─ document.ts           # modelo compartido vista previa + PDF   ← tests
│  ├─ logo.ts               # subida y redimensionado de imágenes
│  ├─ io.ts                 # esquemas Zod + export/import JSON      ← tests
│  ├─ limits.ts             # límites de longitud y del historial
│  ├─ undo.ts               # aviso de "deshacer" tras un borrado     ← tests
│  ├─ sync/                 # cuenta y sincronización opcional         ← tests
│  │  ├─ config.ts          # variables de entorno y bandera
│  │  ├─ client.ts          # Supabase diferido, Auth y consultas
│  │  ├─ engine.ts          # pull/push, conflictos, sesión y eventos
│  │  ├─ authErrors.ts      # errores de Supabase Auth en español     ← tests
│  │  ├─ merge.ts           # validación, fusión de perfil e historial
│  │  ├─ meta.ts            # cursor y cambios pendientes por cuenta
│  │  ├─ owner.ts           # dueño del localStorage y dispositivo
│  │  ├─ guestDirty.ts      # cambios hechos sin sesión
│  │  ├─ localData.ts       # ¿hay algo que merezca la pena subir?
│  │  └─ diff.ts            # documentos nuevos/borrados pendientes
│  └─ describe.ts  ids.ts  utils.ts
├─ store/
│  ├─ useBudgetStore.ts     # Zustand + persist + migraciones
│  ├─ useSyncStore.ts       # estado de la cuenta (usuario, errores, merge)
│  ├─ migrate.ts            # validación/migración de lo guardado     ← tests
│  ├─ useThemeStore.ts      # tema claro/oscuro/sistema
│  ├─ useUiStore.ts         # estado de interfaz (PDF en curso)
│  └─ storage.ts            # almacenamiento con debounce de 500 ms
├─ hooks/                   # useCalc, useTheme, usePdfActions, useSync
├─ components/              # UI (formularios, tabla, clínica, cuenta…)
│  ├─ AccountDialog.tsx     # acceso, estado, contraseña y borrado
│  ├─ PasswordInput.tsx     # campo con mostrar/ocultar
│  └─ PasswordRecoveryDialog.tsx
├─ pdf/                     # plantilla @react-pdf/renderer + acciones
└─ styles/shadcn.css        # base de shadcn/ui (vendida)
scripts/generate-icons.mjs  # genera los iconos PWA (sin dependencias)
supabase/
├─ migrations/              # tablas, triggers y RLS
├─ functions/delete-account # borra el usuario de Auth con service_role
└─ README.md                # puesta en marcha y verificación de RLS
e2e/                        # prueba de humo en navegador + medición de contraste
playwright.config.ts        # Playwright: sirve `dist` con `vite preview`
.github/workflows/ci.yml    # CI: lint + tipos + tests + build + prueba de humo
vercel.json                 # configuración de despliegue
```

## 🗃️ Persistencia y migraciones

- El borrador, el catálogo, los datos de la clínica, el modo de tasa, el tamaño de
  hoja y el **historial** se guardan en `localStorage` con **debounce de 500 ms**.
- La clave es `budgetify:v1` y hay **migraciones versionadas** (`version` + `migrate`).
  Ahora mismo: **v9** (catálogo ampliado). La migración vive en
  `store/migrate.ts` (`migratePersisted`) para poder probarla sin arrancar la app:
  **valida con Zod** lo guardado y cae a los valores por defecto de cada parte si algo no
  encaja, en lugar de romper el arranque.
- `migrateCatalogDefaults()` añade áreas, categorías, servicios y plantillas nuevas, y
  etiqueta con su área los servicios conocidos **sin pisar** los precios que el usuario
  haya editado.

## 🕘 Historial local

`SavedBudget` (`types.ts`) es una entrada del historial: `id`, `savedAt` y el
**presupuesto entero**. Se guarda la copia completa a propósito —y no una
referencia— porque un presupuesto entregado hace un mes debe abrirse tal como
se entregó, aunque el catálogo haya cambiado desde entonces. El nombre del
paciente, el número de líneas y el total **no** se almacenan: se derivan al
mostrar la lista (`HistoryDialog`), así no hay datos duplicados que se queden
desfasados.

- **Tope**: `HISTORY_LIMIT` (100) en `lib/limits.ts`. Al superarlo se descartan
  las más antiguas y `saveToHistory()` devuelve cuántas se cayeron para que la
  interfaz lo avise. El mismo tope se aplica **al leer** (`historySchema`): un
  `localStorage` manipulado a mano con 10.000 entradas no se carga en memoria.
- Abrir una copia **reemplaza** el borrador en curso, y eso también se puede
  deshacer.

### Deshacer o confirmar

Dos mecanismos, según lo que se pierde:

- **Deshacer** (`lib/undo.ts`): para lo granular y reversible —borrar una línea,
  una nota, una categoría o una copia del historial, o cargar otro presupuesto—.
  El aviso guarda una referencia al estado anterior (el store es inmutable) y lo
  restaura. Solo hay un aviso de deshacer a la vez, el más reciente.
- **Confirmación** (`ConfirmDialog`, sobre Radix `AlertDialog`): para lo que
  reemplaza todo de golpe y no se puede reconstruir de memoria —“Limpiar”,
  “Restablecer catálogo”, “Reemplazar plantilla”—. Si además es reversible, el
  diálogo deja deshacer después.

## 🔐 Autenticación

La cuenta es opcional y usa **Supabase Auth**. Hay dos formas de entrar:

1. **Correo y contraseña**: `signUp` / `signInWithPassword`.
2. **Enlace mágico por correo**: `signInWithOtp`.

Ambas crean la misma sesión de Supabase, así que el motor de sincronización no distingue
el método. Un usuario que entró con enlace puede crear una contraseña después desde
**Cuenta → Cambiar contraseña**. La app nunca guarda la contraseña: solo la envía a
Supabase Auth, que guarda su hash.

### Ajustes de Supabase

- **Authentication → Providers → Email**: activado.
- **Confirm email**:
  - **Desactivado** si quieres que el registro con contraseña funcione sin enviar ningún
    correo. El correo actúa solo como identificador.
  - **Activado** si prefieres verificar la propiedad del correo; en ese caso el registro
    envía un correo de confirmación por el SMTP configurado.
- **Minimum password length**: 8 (o más).
- **Rate Limits**: revisa los límites de email y de intentos de contraseña.
- **Authentication → URL Configuration**: añade el dominio de la app y
  `http://localhost:5173`.
- **Authentication → Emails → SMTP**: Gmail SMTP o un proveedor propio. El SMTP
  integrado de Supabase solo entrega a miembros del equipo y permite 2 correos por hora;
  no sirve para usuarios reales.

### Recuperación de contraseña

`resetPasswordForEmail` envía un enlace por el SMTP configurado. Al abrirlo, Supabase
inicia una sesión de recuperación (`PASSWORD_RECOVERY` / `type=recovery`) y la app abre
`PasswordRecoveryDialog`, donde se llama a `updateUser({ password })`. Después se limpian
los tokens de la URL con `clearAuthHash`.

Si el correo no está configurado o el enlace caduca, se muestra el error en el diálogo.
La recuperación no se hace por WhatsApp ni por un código local.

### Errores

`lib/sync/authErrors.ts` traduce los errores de Supabase a mensajes en español:
credenciales incorrectas, cuenta ya registrada, contraseña corta, correo sin confirmar,
límite de intentos, SMTP no autorizado, etc.

### Gmail SMTP

Para usar Gmail como SMTP:

- Cuenta de Google con **verificación en dos pasos**.
- **Contraseñas de aplicaciones** → crear una para “Correo”.
- Supabase → SMTP: host `smtp.gmail.com`, puerto `465` (SSL) o `587` (TLS), usuario el
  Gmail completo, contraseña la de aplicación, sender el mismo Gmail.
- Subir el límite de email en **Authentication → Rate Limits** (Supabase aplica 30/hora
  por defecto con SMTP propio).

Gmail limita a unas 500 direcciones al día en cuentas gratuitas. Es suficiente para una
clínica pequeña, pero no para un envío masivo.

## ☁️ Sincronización opcional

La app sigue siendo **local-first**: el estado de Zustand es la fuente de verdad y la
nube es una réplica. Sin cuenta no se carga Supabase ni se envía nada.

### Claves locales

| Clave | Contenido |
| --- | --- |
| `budgetify:v1` | Estado completo (borrador, catálogo, empresa, historial…) |
| `budgetify:owner:v1` | `userId` dueño de esos datos, `deviceId` y nombre del dispositivo |
| `budgetify:sync:v1:<userId>` | Cursor (`lastPulledAt`), partes pendientes, ids conocidos, lápidas, restauraciones y revisiones |
| `sb-<proyecto>-auth-token` | Sesión que gestiona Supabase Auth |

Los metadatos de sync **no duplican los datos**: solo apuntan qué cambió. Por eso no hace
falta una cola en IndexedDB: si se cierra la pestaña, el propio estado local y las marcas
pendientes permiten reconstruir la subida en el siguiente arranque.

### Flujo

1. Al arrancar, si no hay sesión guardada ni un enlace de acceso/recuperación en la URL, no se descarga
   el chunk de Supabase (`supabase-*.js`, excluido del precache de la PWA).
2. Con sesión, `pullRemote()` trae perfil, borradores y documentos cambiados desde el
   cursor (con 1 s de solapamiento). Todo se valida con Zod antes de aplicarlo.
3. `applyRemoteSnapshot()` fusiona:
   - **Historial**: unión por `id`; las lápidas mandan; si pasa de 100 se descartan los
     más antiguos y se marcan para borrarlos también en la nube.
   - **Borrador**: si solo cambió un lado, gana ese; si cambiaron ambos, se conserva el
     local y la versión remota se archiva como copia de conflicto en el historial.
   - **Perfil**: normalmente gana la última versión; al adoptar el equipo de otra cuenta
     se combina campo a campo (`mergeProfiles`).
4. `pushLocal()` sube solo lo marcado como pendiente y actualiza el cursor con el
   `updated_at` que devuelve el servidor. Si la persona editó durante la subida, las
   referencias cambiaron y se vuelve a marcar para el siguiente ciclo.
5. La sincronización se dispara con debounce de 2 s tras un cambio local, al recuperar
   el foco, al volver la red, al iniciar sesión y con **Sincronizar ahora**.

### Conflictos y numeración

- Las entradas del historial son inmutables y tienen `id` propio: no hay merges de
  contenido.
- Los borrados usan `deleted_at` (lápidas) para que otro equipo no los resucite. Si la
  persona pulsa **Deshacer**, se quita la lápida y el documento se vuelve a subir activo.
- Si un id conocido desaparece del historial **sin** lápida, se interpreta como una
  pérdida local y se hace un pull completo para restaurarlo, en lugar de borrarlo también
  en la nube.
- `quoteCounter` se sincroniza y se recalcula como el máximo entre el local, el remoto y
  los números del historial. Si dos equipos offline emitieron el mismo número, se avisa
  para renumerar; no se renumeran solos.
- Los documentos descartados por el tope de 100 se borran también en la nube.
- Si la nube está vacía, el diálogo de adopción solo ofrece **subir** los documentos
  locales; no permite descartarlos por error. Si hay datos remotos, ofrece combinar o
  usar solo la nube, con confirmación destructiva.

### Equipos compartidos

`budgetify:owner:v1` etiqueta los datos locales con la cuenta a la que pertenecen. Si
otra persona inicia sesión en un equipo con datos de una cuenta anterior, la app **no los
sube automáticamente**: abre `MergeDialog` para combinarlos o descartarlos. Al cerrar
sesión se puede borrar el estado local y los metadatos de sync.

### Seguridad

- RLS en `profiles`, `documents` y `drafts`: `auth.uid() = user_id`.
- El cliente solo usa la clave anónima; `service_role` vive en la Edge Function
  `delete-account`.
- El cifrado es el gestionado por Supabase (tránsito + reposo). **No es E2E**: no se debe
  prometer que el proveedor no puede leer los datos.
- La sintaxis y los límites de los payloads remotos se validan con los mismos esquemas
  Zod de `lib/io.ts`; una fila corrupta se omite y se avisa.

## 🩺 Áreas de práctica

Un `CatalogService.specialtyId` **opcional** indica a qué área pertenece. Las reglas:

- **Con área** → solo aparece en esa área.
- **Sin área** (transversal) → aparece en todas: enfermería, estudios y diagnóstico,
  gastos de clínica y procedimientos ambulatorios los necesita cualquier especialista.
- Sin área seleccionada en el filtro, se ve todo el catálogo.

`lib/catalog.ts` concentra el filtro (`isServiceInArea`, `filterServices`) para que lo
compartan el selector de servicios y el gestor de catálogo.

El **encabezado** del documento depende de `Clinic.headerMode`: `'clinic'` (nombre de la
clínica) o `'professional'` (`doctorTitle` + `doctorName` + el área debajo). Las áreas son
una lista fija en `data/specialties.ts`; la interfaz solo asigna servicios a áreas, no las
crea.

## 🧪 Tests

```bash
npm test
```

Cubren:

- **Dominio**: importes obligatorios (fixture con tasa 876,80), porcentajes, ciclos,
  referencias inexistentes, formato de moneda, parseo numérico, fecha larga y la
  consulta de la tasa BCV (éxito, HTTP erróneo, formato inválido, error de red, timeout).
- **Documento**: modelo compartido (procedimiento, categorías numeradas, cantidad y
  unitario, notas con etiqueta, firmas) y tamaño de hoja.
- **Estado**: pack → ítems → total, edición de precios sin tocar el catálogo,
  sincronización de tarifas, tasa BCV (auto/manual), datos de la clínica e
  historial (guardar, cargar, borrar, copia independiente del borrador y tope).
- **Migración**: lo guardado por versiones anteriores, datos corruptos y el
  recorte del historial.
- **Catálogo**: integridad, packs y migración.
- **Interfaz** (jsdom + Testing Library): línea manual, recálculo del total, reagrupar
  al cambiar de categoría, tema y vista previa.
- **Humo**: render de la app completa sin DOM.
- **Deshacer**: que un clic en un aviso no cierre el diálogo modal.
- **Sync**: fusión de historial (unión, lápidas, tope de 100), perfiles (combinación
  campo a campo), borradores, validación de payloads, copias de conflicto, metadatos
  por usuario, corrupción de `localStorage`, detección de datos locales relevantes,
  deshacer borrados y un **motor completo contra un servidor en memoria** (subida,
  descarga, conflicto y borrado).
- **Auth**: traducción de errores de Supabase (credenciales, cuenta existente,
  contraseña corta, correo sin confirmar, límites y sesión caducada).

### Prueba de humo en un navegador de verdad (`npm run test:e2e`)

Playwright sirve `dist` con `vite preview` (que aplica las **mismas cabeceras**
de `vercel.json`) y comprueba que la app monta, suma una línea, calcula el total
y **mide el contraste real** de cuatro textos clave (título, botón primario,
texto secundario y la barra de total del documento), en tema claro y oscuro,
exigiendo el **4,5:1** de WCAG AA.

El contraste se mide dentro de la página (`e2e/contrast.ts`): Chromium devuelve
los colores en `oklch()` y desde Node no se pueden convertir, así que se pinta
cada color en un canvas de 1×1 y se leen los píxeles; el fondo se busca subiendo
por los antepasados y componiendo las capas semitransparentes. Antes de medir se
espera a que terminen las transiciones: cambiar de tema las dispara y a mitad de
camino los colores son intermedios.

## 🔁 CI

`.github/workflows/ci.yml` ejecuta lint, typecheck, tests y build en cada push/PR a
`main`, y publica `dist/` como artefacto. Un segundo job (`e2e`) descarga ese
artefacto, instala Chromium y corre la prueba de humo; si falla, sube el informe
de Playwright.

## ▲ Despliegue en Vercel

### Solo local (sin cuentas)

1. En **vercel.com/new**, elige *Import Git Repository* y autoriza GitHub con acceso
   al repo.
2. Framework **Vite** (se detecta solo). Build `npm run build`, salida `dist`
   (ya definido en `vercel.json`).
3. **Deploy**. A partir de ahí, cada push a `main` vuelve a desplegar.

No hace falta backend: la app es estática y la tasa se consulta desde el navegador.

### Con sincronización opcional

1. Crea un proyecto en **supabase.com** y copia `Project URL` y `anon key`.
2. Aplica las migraciones de `supabase/migrations/` (con `supabase db push` o pegando
   el SQL en el editor). Verifica que RLS esté activo.
3. Despliega la función de borrado:
   `supabase functions deploy delete-account`.
4. En **Authentication → URL Configuration**, añade como *Redirect URL* el dominio de
   la app (y `http://localhost:5173` para desarrollo).
5. Configura un **SMTP propio** (Resend, Postmark…) si quieres que los enlaces mágicos
   lleguen de forma fiable; el SMTP integrado tiene límites muy bajos.
6. En Vercel, define `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y
   `VITE_SYNC_ENABLED=true`.
7. Para la **demo pública**, crea un segundo proyecto de Vercel con
   `VITE_SYNC_ENABLED=false` (o sin credenciales). Así la demo no almacena datos reales.
8. Revisa la CSP de `vercel.json`: ya permite `https://*.supabase.co` y
   `wss://*.supabase.co`. Si usas un dominio propio de Supabase, ajústala.
9. Prueba con **dos usuarios** que uno no puede leer ni modificar los datos del otro.

Los detalles de puesta en marcha y una lista de comprobación de RLS están en
[`supabase/README.md`](../supabase/README.md).

## ⚡ Rendimiento

- `@react-pdf/renderer` se carga **en diferido**: solo se descarga al exportar,
  imprimir, compartir o ver el PDF.
- El cliente de Supabase también es un chunk dinámico (`supabase-*.js`) y está excluido
  del precache de la PWA. Solo se descarga al abrir la cuenta o al volver de un enlace
  mágico; después queda en caché.
- Los vendors grandes (React, Radix, formularios) se separan en chunks estables.

## 🧭 Decisiones de diseño

- Se guardan **fórmulas**, no montos calculados: los totales se **derivan** siempre.
- Del historial se guarda el **presupuesto entero**, no una referencia al catálogo: una
  copia de hace un mes tiene que abrirse igual que cuando se entregó. El precio que se
  paga es el espacio (por eso hay tope), no la fidelidad.
- Cuando cambias el **tipo de fórmula** de una línea, el importe no se pierde: de
  “precio fijo” a “cantidad × unitario” se conserva el monto como precio unitario. En los
  tipos porcentuales el importe depende de la referencia, así que arrancan al 100 % de
  ella en vez de a cero.
- El catálogo es una **biblioteca** aparte del presupuesto: editar un precio en un
  presupuesto no lo cambia en la biblioteca salvo que se pida explícitamente
  (*Guardar tarifas en el catálogo*).
- `Gastos de Administración` se modela como precio fijo, pero el motor soporta el
  porcentaje de categoría si se cambia la fórmula.
- Las **áreas de práctica** son una lista fija (no se administran desde la UI): evita que
  un usuario se quede sin catálogo por renombrar un área, y mantiene el filtro simple.
- Los precios de las áreas nuevas son **referencias públicas de mercado de Venezuela
  (2026)**, no tarifas oficiales. Los de cirugía general son los menos documentados: van
  como punto de partida y están pensados para editarse.
- En modo **profesional independiente** sin clínica real no se dibuja el bloque de firma
  de la clínica: el nombre de relleno no vale como identidad para un sello.
- La sincronización es **opcional y local-first**: el estado de Zustand sigue siendo la
  fuente de verdad. La nube es una réplica y la app debe seguir funcionando sin red.
- Los conflictos **no borran trabajo**: el borrador perdedor se archiva en el historial
  con una nota; el perfil se combina campo a campo al adoptar otro equipo.
- El historial mantiene el tope de 100 también en la nube. Es una decisión de producto
  (espacio y velocidad), no un límite técnico de Postgres.
- La cuenta admite **correo + contraseña** y **enlace mágico**. La contraseña permite
  entrar sin depender del correo; el enlace sirve para quien no quiera recordar una
  contraseña y para la recuperación. El costo es mantener el SMTP si se usa el enlace.
- Con **Confirm email** desactivado, el correo es un identificador, no una prueba de
  propiedad. Es aceptable para una app de presupuestos con datos por usuario, pero debe
  quedar claro en la política de privacidad. Si se activa, el registro exige confirmar el
  correo por SMTP.
