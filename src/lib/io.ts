import { z } from 'zod'
import type { Budget, Catalog } from '@/types'

/** Esquemas Zod: validan los JSON importados antes de tocar el estado. */

export const formulaSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed'), amountUsd: z.number().finite() }),
  z.object({
    type: z.literal('qty_unit'),
    qty: z.number().finite().nonnegative(),
    unitUsd: z.number().finite(),
  }),
  z.object({
    type: z.literal('percent_of_item'),
    refConcept: z.string().min(1),
    percent: z.number().finite(),
  }),
  z.object({
    type: z.literal('percent_of_subtotal'),
    category: z.string().min(1),
    percent: z.number().finite(),
  }),
])

export const itemSchema = z.object({
  id: z.string().min(1),
  sourceServiceId: z.string().min(1).optional(),
  category: z.string().min(1),
  concept: z.string().min(1),
  detail: z.string().optional(),
  formula: formulaSchema,
})

export const patientSchema = z.object({
  name: z.string(),
  ci: z.string().optional(),
  age: z.number().int().positive().max(130).optional(),
})

export const budgetSchema = z.object({
  patient: patientSchema,
  procedure: z.string().optional(),
  issueDate: z.string().min(1),
  rate: z.number().finite().positive(),
  items: z.array(itemSchema),
  notes: z.array(z.string()),
})

export const catalogServiceSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  concept: z.string().min(1),
  detail: z.string().optional(),
  formula: formulaSchema,
})

export const packSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  services: z.array(
    z.object({
      serviceId: z.string().min(1),
      qty: z.number().finite().nonnegative().optional(),
    }),
  ),
})

export const catalogSchema = z.object({
  categories: z.array(z.string().min(1)),
  services: z.array(catalogServiceSchema),
  packs: z.array(packSchema),
})

export const clinicSchema = z.object({
  name: z.string(),
  rif: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logoDataUrl: z.string().optional(),
  doctorName: z.string().optional(),
  doctorId: z.string().optional(),
  signatureDataUrl: z.string().optional(),
  sealDataUrl: z.string().optional(),
  showSignature: z.boolean().optional(),
})

export const bcvCacheSchema = z.object({
  value: z.number().finite().positive().nullable(),
  updatedAt: z.string().nullable(),
  fetchedAt: z.string().nullable(),
  status: z.enum(['idle', 'loading', 'ok', 'error']),
  error: z.string().nullable(),
})

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
