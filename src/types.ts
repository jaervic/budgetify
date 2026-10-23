/**
 * Modelo de datos de Budgetify (presupuestos médicos y cotizaciones).
 *
 * Se distinguen dos capas:
 *  - El catálogo (`Catalog`): biblioteca de servicios y de productos. Persistente y editable.
 *  - El documento (`Budget` o `Quote`): una instancia puntual. Editar precios aquí NO
 *    altera el catálogo salvo que el usuario lo pida explícitamente.
 */

/** Fórmulas soportadas para calcular el monto en USD de un ítem. */
export type Formula =
  | { type: 'fixed'; amountUsd: number }
  | { type: 'qty_unit'; qty: number; unitUsd: number }
  | { type: 'percent_of_item'; refConcept: string; percent: number }
  | { type: 'percent_of_subtotal'; category: string; percent: number }

export type FormulaType = Formula['type']

/** Línea del presupuesto. */
export interface Item {
  id: string
  /** Servicio del catálogo del que provino (para sincronizar tarifas). */
  sourceServiceId?: string
  category: string
  concept: string
  detail?: string
  formula: Formula
}

export interface Patient {
  name: string
  ci?: string
  age?: number
}

export interface Budget {
  patient: Patient
  /** Nombre del procedimiento o motivo del presupuesto. */
  procedure?: string
  /** Fecha de emisión en formato ISO corto (yyyy-mm-dd). */
  issueDate: string
  /** Tasa de cálculo: bolívares por cada dólar. */
  rate: number
  items: Item[]
  notes: string[]
}

/** Tipo de documento que se está editando o que se guardó en el historial. */
export type DocMode = 'budget' | 'quote'

export interface QuoteClient {
  name: string
  /** Código interno del cliente. Opcional en el documento. */
  code?: string
  rif?: string
  phones?: string
  address?: string
}

/** Línea de una cotización de productos. */
export interface QuoteItem {
  id: string
  /** Producto del catálogo del que provino (si aplica). */
  sourceProductId?: string
  code: string
  description: string
  qty: number
  unit: string
  /** Precio unitario en USD, sin IVA. */
  unitPriceUsd: number
  /** Porcentaje de IVA aplicado a la línea. */
  taxRate: number
}

/**
 * Cotización de productos.
 *
 * El número y los datos del cliente son la identificación mínima del
 * documento. Los datos de vendedor, oficina, transporte, vencimiento, orden de
 * compra y descripción son opcionales: solo se imprimen si tienen valor.
 */
export interface Quote {
  number: string
  client: QuoteClient
  seller?: string
  office?: string
  transport?: string
  /** Moneda del documento. Por ahora siempre USD, como en la referencia. */
  currency: 'USD'
  issueDate: string
  dueDate?: string
  purchaseOrder?: string
  description?: string
  /** Tasa de cálculo: bolívares por cada dólar. */
  rate: number
  items: QuoteItem[]
}

/**
 * Documento archivado a mano en el historial del navegador.
 *
 * Se guarda el documento completo y nada más: el nombre del paciente o del
 * cliente y el total se derivan al mostrarlo, así no hay copias desfasadas.
 */
export interface SavedBudget {
  id: string
  /** Cuándo se archivó (ISO completo; también da el orden). */
  savedAt: string
  kind: 'budget'
  budget: Budget
}

export interface SavedQuote {
  id: string
  savedAt: string
  kind: 'quote'
  quote: Quote
}

export type SavedDocument = SavedBudget | SavedQuote

/** Tamaño de hoja del documento. */
export type PageSize = 'A4' | 'Letter' | 'Legal'

/**
 * Área de práctica (especialidad). Agrupa los servicios propios de un tipo de
 * consulta: odontología, traumatología, pediatría…
 *
 * Un servicio **sin** área es transversal y se ofrece a todas las áreas (por
 * ejemplo enfermería o estudios de diagnóstico, que cualquier especialista
 * termina necesitando).
 */
export interface Specialty {
  id: string
  name: string
  /** Títulos profesionales sugeridos, para no escribirlos a mano. */
  titles: string[]
}

/** Servicio de la biblioteca de tarifas de la clínica. */
export interface CatalogService {
  id: string
  category: string
  concept: string
  detail?: string
  formula: Formula
  /** Área de práctica a la que pertenece. Sin valor = transversal. */
  specialtyId?: string
}

/** Plantilla reutilizable de servicios para un tipo de caso médico. */
export interface Pack {
  id: string
  name: string
  description?: string
  services: PackService[]
}

export interface PackService {
  serviceId: string
  /** Sobrescribe la cantidad cuando la fórmula del servicio es `qty_unit`. */
  qty?: number
}

/**
 * Producto del catálogo de cotizaciones.
 *
 * Es independiente de los servicios médicos: se usa para cotizar insumos o
 * artículos con código, unidad de venta e IVA propio. El precio es la base sin
 * IVA, igual que en la hoja de cotización de referencia.
 */
export interface Product {
  id: string
  code: string
  description: string
  unit: string
  priceUsd: number
  /** Porcentaje de IVA (16 por defecto; 0 para exentos). */
  taxRate: number
}

export interface Catalog {
  /** Orden en que se muestran las categorías. */
  categories: string[]
  services: CatalogService[]
  packs: Pack[]
  /** Áreas de práctica disponibles, en el orden en que se muestran. */
  specialties: Specialty[]
  /** Productos para la modalidad de cotización. */
  products: Product[]
}

/** Cómo aplicar un pack a un presupuesto que ya tiene ítems. */
export type PackApplyMode = 'append' | 'replace'

/** Cómo se encabeza el documento. */
export type HeaderMode = 'clinic' | 'professional'

/** Datos de la clínica que encabezan el documento. */
export interface Clinic {
  name: string
  /** Registro de Información Fiscal, p. ej. J-12345678-9. */
  rif: string
  address?: string
  phone?: string
  email?: string
  /** Logo como data URL (PNG/JPG) para incrustarlo en el PDF. */
  logoDataUrl?: string
  /**
   * Quién encabeza el documento: la clínica o el profesional por su nombre
   * (útil para consultorios y profesionales independientes).
   */
  headerMode: HeaderMode
  /** Título del profesional: Dr., Dra., Od., Lcdo.… (texto libre). */
  doctorTitle?: string
  /** Área de práctica del profesional (id de `Specialty`). */
  specialtyId?: string
  /** Médico tratante que firma el documento. */
  doctorName?: string
  /** Colegio de médicos / MPPS del médico tratante. */
  doctorId?: string
  /** Imagen de firma del médico (data URL). */
  signatureDataUrl?: string
  /** Imagen del sello de la clínica (data URL). */
  sealDataUrl?: string
  /** Mostrar el bloque de firmas al final del documento. */
  showSignature?: boolean
}

/** Modo de la tasa de cálculo: anclada al BCV o fijada a mano. */
export type RateMode = 'auto' | 'manual'

export type BcvStatus = 'idle' | 'loading' | 'ok' | 'error'

/** Último valor conocido de la tasa BCV (se cachea para uso offline). */
export interface BcvCache {
  value: number | null
  /** Fecha de actualización que informa el BCV. */
  updatedAt: string | null
  /** Cuándo se consultó por última vez. */
  fetchedAt: string | null
  status: BcvStatus
  error: string | null
}

