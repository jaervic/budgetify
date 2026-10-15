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
| Tests | Vitest 5 + Testing Library + jsdom |
| Navegador | Playwright (prueba de humo y contraste) |

Sin backend, sin login, sin base de datos remota.

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
│  └─ describe.ts  ids.ts  utils.ts
├─ store/
│  ├─ useBudgetStore.ts     # Zustand + persist + migraciones
│  ├─ migrate.ts            # validación/migración de lo guardado     ← tests
│  ├─ useThemeStore.ts      # tema claro/oscuro/sistema
│  ├─ useUiStore.ts         # estado de interfaz (PDF en curso)
│  └─ storage.ts            # almacenamiento con debounce de 500 ms
├─ hooks/                   # useCalc, useTheme, usePdfActions
├─ components/              # UI (formularios, tabla, clínica, vista previa…)
├─ pdf/                     # plantilla @react-pdf/renderer + acciones
└─ styles/shadcn.css        # base de shadcn/ui (vendida)
scripts/generate-icons.mjs  # genera los iconos PWA (sin dependencias)
e2e/                        # prueba de humo en navegador + medición de contraste
playwright.config.ts        # Playwright: sirve `dist` con `vite preview`
.github/workflows/ci.yml    # CI: lint + tipos + tests + build + prueba de humo
vercel.json                 # configuración de despliegue
```

## 🗃️ Persistencia y migraciones

- El borrador, el catálogo, los datos de la clínica, el modo de tasa, el tamaño de
  hoja y el **historial** se guardan en `localStorage` con **debounce de 500 ms**.
- La clave es `budgetify:v1` y hay **migraciones versionadas** (`version` + `migrate`).
  Ahora mismo: **v7** (historial de presupuestos guardados). La migración vive en
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

1. En **vercel.com/new**, elige *Import Git Repository* y autoriza GitHub con acceso
   al repo.
2. Framework **Vite** (se detecta solo). Build `npm run build`, salida `dist`
   (ya definido en `vercel.json`).
3. **Deploy**. A partir de ahí, cada push a `main` vuelve a desplegar.

No hace falta backend: la app es estática y la tasa se consulta desde el navegador.

## ⚡ Rendimiento

- `@react-pdf/renderer` se carga **en diferido**: solo se descarga al exportar,
  imprimir, compartir o ver el PDF.
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
