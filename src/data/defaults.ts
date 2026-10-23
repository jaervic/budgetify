import type { BcvCache, Budget, Clinic, PageSize, Quote } from '@/types'

/** Tasa VES/USD por defecto (la de los ejemplos del proyecto). */
export const DEFAULT_RATE = 876.8

/** Tamaño de hoja por defecto del presupuesto médico (el del documento de referencia). */
export const DEFAULT_PAGE_SIZE: PageSize = 'A4'

/** La cotización se pensó para Carta: es el tamaño del formato de referencia. */
export const DEFAULT_QUOTE_PAGE_SIZE: PageSize = 'Letter'

/** IVA general de referencia en Venezuela. Cada producto puede cambiarlo. */
export const DEFAULT_TAX_RATE = 16

/**
 * Datos de la clínica. Son marcadores de ejemplo: edítalos en
 * "Datos de la clínica" (se guardan en el navegador).
 */
export const DEFAULT_CLINIC: Clinic = {
  name: 'Clínica — edita tus datos',
  rif: 'J-00000000-0',
  address: '',
  phone: '',
  email: '',
  headerMode: 'clinic',
  doctorTitle: 'Dr.',
  specialtyId: undefined,
  doctorName: '',
  doctorId: '',
  showSignature: true,
}

/**
 * Notas legales y recomendaciones que se incluyen en el presupuesto y el PDF.
 * Los datos bancarios van como marcador: el sitio publicado no expone cuentas
 * reales. Complétalos en la app (se guardan solo en tu navegador).
 */
export const DEFAULT_NOTES: string[] = [
  'Formas de Pago: Transferencias a las cuentas de la clínica (edita esta nota con los datos reales: banco, cuenta y titular).',
  'Fluctuación Cambiaria: El monto en Bolívares (VES) mostrado está anclado a la tasa oficial. Al momento de realizar el pago, la clínica o el médico tratante ajustarán el monto a la tasa oficial del día de facturación.',
  'Fondo de Imprevistos: Se recomienda disponer de un 10% a 15% adicional para cubrir posibles variaciones en la duración de la cirugía o requerimiento de medicamentos postoperatorios no contemplados en el presupuesto estándar.',
]

/** Fecha de hoy en formato ISO corto (yyyy-mm-dd), usada como emisión por defecto. */
export function todayIso(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

/** Presupuesto vacío listo para empezar a cargar servicios. */
export function createEmptyBudget(): Budget {
  return {
    patient: { name: '' },
    procedure: '',
    issueDate: todayIso(),
    rate: DEFAULT_RATE,
    items: [],
    notes: [...DEFAULT_NOTES],
  }
}

/** Correlativo de cotización con nueve dígitos, como en la hoja de referencia. */
export function formatQuoteNumber(counter: number): string {
  return String(Math.max(1, Math.trunc(counter))).padStart(9, '0')
}

/** Lee el número de una cotización editada a mano ("COT-000042" → 42). */
export function quoteNumberValue(number: string): number {
  const digits = Number.parseInt(number.replace(/\D/g, ''), 10)
  return Number.isFinite(digits) && digits > 0 ? digits : 0
}

/** Cotización vacía lista para empezar a cargar productos. */
export function createEmptyQuote(number = formatQuoteNumber(1)): Quote {
  return {
    number,
    client: { name: '' },
    currency: 'USD',
    showBothCurrencies: false,
    issueDate: todayIso(),
    rate: DEFAULT_RATE,
    items: [],
  }
}

/** Copia de los datos de clínica por defecto. */
export function cloneDefaultClinic(): Clinic {
  return { ...DEFAULT_CLINIC }
}

/** Estado inicial de la caché de la tasa BCV. */
export function createEmptyBcvCache(): BcvCache {
  return { value: null, updatedAt: null, fetchedAt: null, status: 'idle', error: null }
}
