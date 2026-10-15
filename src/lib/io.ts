import { z } from 'zod'
import { LIMITS, HISTORY_LIMIT } from './limits'
import type { Budget, Catalog } from '@/types'

/**
 * Esquemas Zod: validan los JSON importados antes de tocar el estado.
 *
 * Además de comprobar tipos, limitan tamaños y longitudes: así un archivo
 * malicioso o corrupto no puede llenar el almacenamiento del navegador ni
 * colgar la app con listas enormes.
 *
 * Los máximos de texto salen de `limits.ts`, que también alimenta los
 * `maxLength` de los formularios.
 */

const MAX_ITEMS = 500
const MAX_NOTES = 50
const MAX_NOTE_LENGTH = LIMITS.note
const MAX_TEXT = 200
/** ~2,2 MB de imagen real (base64 ocupa ~33 % más). */
const MAX_IMAGE_CHARS = 3_000_000
const MAX_MONEY = 1_000_000

/** Solo se aceptan imágenes incrustadas como data URL de PNG/JPG/WEBP. */
const imageDataUrl = z
  .string()
  .max(MAX_IMAGE_CHARS, 'La imagen es demasiado grande.')
  .regex(
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    'La imagen debe ser un archivo PNG, JPG o WEBP.',
  )

const money = z.number().finite().min(-MAX_MONEY).max(MAX_MONEY)
const shortText = z.string().max(MAX_TEXT)

export const formulaSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed'), amountUsd: money }),
  z.object({
    type: z.literal('qty_unit'),
    qty: z.number().finite().min(0).max(10_000),
    unitUsd: money,
  }),
  z.object({
    type: z.literal('percent_of_item'),
    refConcept: z.string().min(1).max(120),
    percent: z.number().finite().min(-1000).max(1000),
  }),
  z.object({
    type: z.literal('percent_of_subtotal'),
    category: z.string().min(1).max(80),
    percent: z.number().finite().min(-1000).max(1000),
  }),
])

export const itemSchema = z.object({
  id: z.string().min(1).max(100),
  sourceServiceId: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(LIMITS.category),
  concept: z.string().min(1).max(LIMITS.concept),
  detail: z.string().max(LIMITS.detail).optional(),
  formula: formulaSchema,
})

export const patientSchema = z.object({
  name: z.string().max(LIMITS.patientName),
  ci: z.string().max(LIMITS.patientCi).optional(),
  age: z.number().int().min(0).max(130).optional(),
})

export const budgetSchema = z.object({
  patient: patientSchema,
  procedure: z.string().max(LIMITS.procedure).optional(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
  rate: z.number().finite().min(0.0001).max(1_000_000),
  items: z.array(itemSchema).max(MAX_ITEMS),
  notes: z.array(z.string().max(MAX_NOTE_LENGTH)).max(MAX_NOTES),
})

export const catalogServiceSchema = z.object({
  id: z.string().min(1).max(100),
  category: z.string().min(1).max(LIMITS.category),
  concept: z.string().min(1).max(LIMITS.concept),
  detail: z.string().max(LIMITS.detail).optional(),
  formula: formulaSchema,
  specialtyId: z.string().max(60).optional(),
})

export const packSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(LIMITS.packName),
  description: z.string().max(LIMITS.packDescription).optional(),
  services: z
    .array(
      z.object({
        serviceId: z.string().min(1).max(100),
        qty: z.number().finite().min(0).max(10_000).optional(),
      }),
    )
    .max(MAX_ITEMS),
})

export const specialtySchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(80),
  titles: z.array(z.string().max(40)).max(20),
})

export const catalogSchema = z.object({
  categories: z.array(shortText.min(1)).max(80),
  services: z.array(catalogServiceSchema).max(MAX_ITEMS),
  packs: z.array(packSchema).max(100),
  // Por defecto vacío: los catálogos guardados antes de existir las áreas se
  // completan luego con `migrateCatalogDefaults`.
  specialties: z.array(specialtySchema).max(50).default([]),
})

export const clinicSchema = z.object({
  name: z.string().max(LIMITS.clinicName),
  rif: z.string().max(LIMITS.clinicRif),
  address: z.string().max(LIMITS.clinicAddress).optional(),
  phone: z.string().max(LIMITS.clinicPhone).optional(),
  email: z.string().max(LIMITS.clinicEmail).optional(),
  logoDataUrl: imageDataUrl.optional(),
  // `default` para no perder los datos de clínica guardados antes de este campo.
  headerMode: z.enum(['clinic', 'professional']).default('clinic'),
  doctorTitle: z.string().max(LIMITS.doctorTitle).optional(),
  specialtyId: z.string().max(60).optional(),
  doctorName: z.string().max(LIMITS.doctorName).optional(),
  doctorId: z.string().max(LIMITS.doctorId).optional(),
  signatureDataUrl: imageDataUrl.optional(),
  sealDataUrl: imageDataUrl.optional(),
  showSignature: z.boolean().optional(),
})

export const bcvCacheSchema = z.object({
  value: z.number().finite().positive().nullable(),
  updatedAt: z.string().nullable(),
  fetchedAt: z.string().nullable(),
  status: z.enum(['idle', 'loading', 'ok', 'error']),
  error: z.string().nullable(),
})

/** Entrada del historial: el presupuesto archivado, con su fecha. */
export const savedBudgetSchema = z.object({
  id: z.string().min(1).max(100),
  savedAt: z.string().max(40),
  budget: budgetSchema,
})

/**
 * El historial entero. El tope también se aplica al leer: si alguien edita el
 * `localStorage` a mano y mete 10.000 entradas, no se cargan en memoria.
 */
export const historySchema = z.array(savedBudgetSchema).max(HISTORY_LIMIT)

/** Primer mensaje de error legible para el usuario. */
function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'El archivo no tiene el formato esperado.'
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}

export function parseBudget(input: unknown): Budget {
  const result = budgetSchema.safeParse(input)
  if (!result.success) throw new Error(firstIssue(result.error))
  return result.data
}

export function parseCatalog(input: unknown): Catalog {
  const result = catalogSchema.safeParse(input)
  if (!result.success) throw new Error(firstIssue(result.error))
  return result.data
}

// ── Utilidades de archivo (navegador) ────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, filename)
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Evita intentar leer archivos enormes que no son un presupuesto.
    if (file.size > 5_000_000) {
      reject(new Error('El archivo es demasiado grande (máximo 5 MB).'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error('El archivo no es un JSON válido.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}

/** Sufijo de fecha para nombrar archivos exportados. */
export function fileStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
