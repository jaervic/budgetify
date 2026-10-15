import type { Budget, Clinic, PageSize, RateMode } from '@/types'
import { DEFAULT_CLINIC } from '@/data/defaults'
import { doctorFullName, specialtyName } from '@/data/specialties'
import type { CalcResult, ComputedItem } from './calc'
import { formatLongDate } from './date'
import { formatRate, formatUsd, formatVes, usdToVes } from './money'

export interface DocumentRow {
  id: string
  concept: string
  detail: string
  amountUsd: string
  amountVes: string
}

export interface DocumentSection {
  /** Número de la categoría (1, 2, …). */
  index: number
  title: string
  rows: DocumentRow[]
  subtotalLabel: string
  subtotalUsd: string
  subtotalVes: string
}

export interface DocumentNote {
  label: string
  body: string
}

export interface DocumentSignature {
  label: string
  imageDataUrl?: string
  name?: string
  extra?: string
}

/** Estructura común que alimenta tanto la vista previa HTML como el PDF. */
export interface DocumentModel {
  clinic: Clinic
  title: string
  /** Quién encabeza la hoja: la clínica o el profesional por su nombre. */
  headerTitle: string
  /** Línea fina bajo el encabezado (el área de práctica del profesional). */
  headerSubtitle?: string
  procedure: string
  issueDate: string
  rateLabel: string
  patient: Budget['patient']
  sections: DocumentSection[]
  totalUsd: string
  totalVes: string
  notes: DocumentNote[]
  signatures: DocumentSignature[]
  pageSize: PageSize
  footerNote: string
}

export interface DocumentOptions {
  rateMode: RateMode
  pageSize: PageSize
  /** Nombre del área de práctica del profesional, si eligió una. */
  specialtyName?: string
}

/** Concepto con la cantidad cuando la fórmula es cantidad × unitario. */
function rowConcept(item: ComputedItem): string {
  return item.formula.type === 'qty_unit'
    ? `${item.concept} (${item.formula.qty})`
    : item.concept
}

/** Detalle de cálculo; añade el precio unitario en fórmulas cantidad × unitario. */
function rowDetail(item: ComputedItem): string {
  const base = item.detail?.trim() || '—'
  return item.formula.type === 'qty_unit'
    ? `${base} (${formatUsd(item.formula.unitUsd)} c/u)`
    : base
}

/** Separa una nota en etiqueta y texto ("Formas de Pago: ..."). */
function splitNote(note: string): DocumentNote {
  const index = note.indexOf(':')
  if (index === -1) return { label: '', body: note.trim() }
  return {
    label: note.slice(0, index).trim(),
    body: note.slice(index + 1).trim(),
  }
}

function buildSignatures(clinic: Clinic): DocumentSignature[] {
  if (clinic.showSignature === false) return []
  const professional = clinic.headerMode === 'professional'
  const clinicName = clinic.name?.trim()
  // En modo profesional, sin una clínica real no se firma "en nombre de" nada:
  // el nombre de relleno no vale como identidad para el sello.
  const hasClinicIdentity = Boolean(clinicName && clinicName !== DEFAULT_CLINIC.name)

  const blocks: DocumentSignature[] = [
    {
      label: 'Firma y Sello del Médico Tratante',
      imageDataUrl: clinic.signatureDataUrl,
      name: doctorFullName(clinic.doctorTitle, clinic.doctorName).trim() || undefined,
      extra: clinic.doctorId?.trim() || undefined,
    },
  ]

  if (!professional || hasClinicIdentity) {
    blocks.push({
      label: 'Firma y Sello de la Clínica',
      imageDataUrl: clinic.sealDataUrl,
      name: clinicName || undefined,
      extra: clinic.rif?.trim() ? `RIF: ${clinic.rif.trim()}` : undefined,
    })
  }

  return blocks
}

/**
 * Construye el modelo del documento con los importes ya formateados.
 * Compartirlo evita que la vista previa y el PDF se desincronicen.
 */
export function buildDocumentModel(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: DocumentOptions,
): DocumentModel {
  const groups = new Map<string, ComputedItem[]>()
  for (const item of calc.items) {
    const list = groups.get(item.category)
    if (list) list.push(item)
    else groups.set(item.category, [item])
  }

  const sections: DocumentSection[] = [...groups.entries()].map(
    ([category, items], index) => {
      const label = category || 'Sin categoría'
      const subtotal =
        calc.subtotals.find((entry) => entry.category === category)?.amountUsd ?? 0
      return {
        index: index + 1,
        title: label.toUpperCase(),
        rows: items.map((item) => ({
          id: item.id,
          concept: rowConcept(item),
          detail: rowDetail(item),
          amountUsd: formatUsd(item.amountUsd),
          amountVes: formatVes(usdToVes(item.amountUsd, budget.rate)),
        })),
        subtotalLabel: `Subtotal ${label}:`,
        subtotalUsd: formatUsd(subtotal),
        subtotalVes: formatVes(usdToVes(subtotal, budget.rate)),
      }
    },
  )

  const professional = clinic.headerMode === 'professional'
  const headerTitle = professional
    ? doctorFullName(clinic.doctorTitle, clinic.doctorName).trim() ||
      clinic.name.trim() ||
      'Presupuesto Médico'
    : clinic.name.trim() || 'Clínica'

  return {
    clinic,
    title: 'Presupuesto Médico',
    headerTitle,
    headerSubtitle: professional
      ? (options.specialtyName ?? specialtyName(clinic.specialtyId))
      : undefined,
    procedure: budget.procedure?.trim() || '',
    issueDate: formatLongDate(budget.issueDate),
    rateLabel: `${formatRate(budget.rate)} VES/USD${
      options.rateMode === 'auto' ? ' (BCV)' : ''
    }`,
    patient: budget.patient,
    sections,
    totalUsd: formatUsd(calc.totalUsd),
    totalVes: formatVes(usdToVes(calc.totalUsd, budget.rate)),
    notes: budget.notes
      .filter((note) => note.trim())
      .map(splitNote),
    signatures: buildSignatures(clinic),
    pageSize: options.pageSize,
    footerNote: 'Documento Financiero Confidencial - Presupuesto Estimado',
  }
}

/** Dimensiones (pt) de cada tamaño de hoja, para la vista previa. */
export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number; label: string }> = {
  A4: { width: 595.28, height: 841.89, label: 'A4' },
  Letter: { width: 612, height: 792, label: 'Carta' },
  Legal: { width: 612, height: 1008, label: 'Oficio' },
}
