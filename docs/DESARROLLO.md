# Documentación técnica

Guía para quien quiera **usar, modificar o desplegar** el proyecto. Si solo quieres
usar la aplicación, mira el [README](../README.md).

## 🧱 Stack

| Área | Tecnología |
| --- | --- |
| Build | Vite 8 + TypeScript 6 (`strict`) |
| UI | React 19 · Tailwind CSS 4 · shadcn/ui (Radix) |
| Estado | Zustand 5 (+ `persist` con debounce) |
| Formularios | React Hook Form + Zod 4 |
| Dinero | `decimal.js` (nunca `float` para cálculos) |
| PDF | `@react-pdf/renderer` (carga perezosa) |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest 5 + Testing Library + jsdom |

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
│  └─ describe.ts  ids.ts  utils.ts
├─ store/
│  ├─ useBudgetStore.ts     # Zustand + persist + migraciones
│  ├─ migrate.ts            # validación/migración de lo guardado     ← tests
│  ├─ useThemeStore.ts      # tema claro/oscuro/sistema
│  └─ storage.ts            # almacenamiento con debounce de 500 ms
├─ hooks/                   # useCalc, useTheme, usePdfActions
├─ components/              # UI (formularios, tabla, clínica, vista previa…)
├─ pdf/                     # plantilla @react-pdf/renderer + acciones
└─ styles/shadcn.css        # base de shadcn/ui (vendida)
scripts/generate-icons.mjs  # genera los iconos PWA (sin dependencias)
.github/workflows/ci.yml    # CI: lint + tipos + tests + build
vercel.json                 # configuración de despliegue
```

## 🗃️ Persistencia y migraciones

- El borrador, el catálogo, los datos de la clínica, el modo de tasa y el tamaño de
  hoja se guardan en `localStorage` con **debounce de 500 ms**.
- La clave es `budgetify:v1` y hay **migraciones versionadas** (`version` + `migrate`).
  Ahora mismo: **v6** (áreas de práctica y encabezado de la hoja). La migración vive en
  `store/migrate.ts` (`migratePersisted`) para poder probarla sin arrancar la app:
  **valida con Zod** lo guardado y cae a los valores por defecto de cada parte si algo no
  encaja, en lugar de romper el arranque.
- `migrateCatalogDefaults()` añade áreas, categorías, servicios y plantillas nuevas, y
  etiqueta con su área los servicios conocidos **sin pisar** los precios que el usuario
  haya editado.

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
  sincronización de tarifas, tasa BCV (auto/manual) y datos de la clínica.
- **Catálogo**: integridad, packs y migración.
- **Interfaz** (jsdom + Testing Library): línea manual, recálculo del total, reagrupar
  al cambiar de categoría, tema y vista previa.
- **Humo**: render de la app completa sin DOM.

## 🔁 CI

`.github/workflows/ci.yml` ejecuta lint, typecheck, tests y build en cada push/PR a
`main`, y publica `dist/` como artefacto.

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
