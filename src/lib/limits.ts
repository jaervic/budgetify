/**
 * Límites de longitud del modelo.
 *
 * Los comparten los esquemas de validación (`io.ts`) y los `maxLength` de los
 * formularios. Importa que coincidan: si un campo admite más texto del que
 * acepta el esquema, el borrador guardado deja de validar y al recargar se
 * pierde el presupuesto entero.
 */
export const LIMITS = {
  /** Categoría de un ítem del presupuesto o de un servicio del catálogo. */
  category: 80,
  concept: 120,
  detail: 300,
  patientName: 120,
  patientCi: 40,
  procedure: 160,
  note: 1000,
  packName: 120,
  packDescription: 300,
  clinicName: 120,
  clinicRif: 40,
  clinicAddress: 200,
  clinicPhone: 60,
  clinicEmail: 120,
  doctorTitle: 40,
  doctorName: 120,
  doctorId: 60,
  /** Catálogo de productos de cotización. */
  productCode: 40,
  productDescription: 200,
  productUnit: 20,
  /** Datos de la cotización. */
  quoteNumber: 40,
  quoteClientCode: 40,
  quoteClientName: 160,
  quoteClientRif: 40,
  quoteClientPhones: 80,
  quoteClientAddress: 200,
  quoteSeller: 120,
  quoteOffice: 120,
  quoteTransport: 120,
  quotePurchaseOrder: 60,
  quoteDescription: 300,
} as const

/**
 * Presupuestos que se conservan en el historial local. Al superarlo se borran
 * los más viejos y se avisa.
 *
 * El `localStorage` ronda los 5 MB y un presupuesto ocupa unos pocos KB, así
 * que 100 entradas se quedan muy por debajo del tope; el límite está para no
 * acercarse siquiera a la cuota ni volver lenta la app.
 */
export const HISTORY_LIMIT = 100
