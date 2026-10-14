import { createElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { CalcResult } from '@/lib/calc'
import { downloadBlob } from '@/lib/io'
import { formatUsd, formatVes, usdToVes } from '@/lib/money'
import type { Budget, Clinic, PageSize, RateMode } from '@/types'

/** Opciones del documento que afectan a su render. */
export interface PdfOptions {
  rateMode: RateMode
  pageSize: PageSize
}

/**
 * Construye el PDF de forma perezosa: `@react-pdf/renderer` pesa bastante, así
 * que sólo se descarga cuando el usuario pulsa PDF / Imprimir / Compartir.
 */
export async function buildPdfBlob(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<Blob> {
  const [{ pdf }, { BudgetPdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./BudgetPdf'),
  ])
  const element = createElement(BudgetPdf, {
    budget,
    calc,
    clinic,
    rateMode: options.rateMode,
    pageSize: options.pageSize,
  }) as React.ReactElement<DocumentProps>
  return pdf(element).toBlob()
}

function slug(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'paciente'
  )
}

export function pdfFileName(budget: Budget): string {
  return `presupuesto-${slug(budget.patient.name)}-${budget.issueDate || 'borrador'}.pdf`
}

export async function downloadBudgetPdf(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<void> {
  const blob = await buildPdfBlob(budget, calc, clinic, options)
  downloadBlob(blob, pdfFileName(budget))
}

/**
 * Abre el PDF en una pestaña nueva (visor nativo). En iOS Safari es la forma
 * fiable de verlo/imprimirlo, porque no renderiza PDFs en un iframe.
 *
 * La pestaña se abre de forma SÍNCRONA (aún dentro del gesto del usuario) y el
 * PDF se carga después. Así el bloqueador de popups no la corta, porque no se
 * abre tras un `await`.
 */
export async function openPdfInNewTab(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<void> {
  const preview = window.open('', '_blank')
  try {
    const blob = await buildPdfBlob(budget, calc, clinic, options)
    const url = URL.createObjectURL(blob)
    if (preview && !preview.closed) {
      preview.location.href = url
      preview.focus()
    } else {
      downloadBlob(blob, pdfFileName(budget))
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    preview?.close()
    throw error
  }
}

/** Imprimir: abre el PDF en una pestaña nueva para lanzar la impresión desde el visor. */
export function printBudgetPdf(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<void> {
  return openPdfInNewTab(budget, calc, clinic, options)
}

/** Resumen de texto corto para compartir por WhatsApp. */
export function buildWhatsAppText(budget: Budget, calc: CalcResult): string {
  const lines = [
    'Presupuesto médico',
    `Paciente: ${budget.patient.name || '—'}`,
    budget.procedure ? `Procedimiento: ${budget.procedure}` : '',
    `Fecha: ${budget.issueDate}`,
    '',
  ].filter((line) => line !== '')
  for (const subtotal of calc.subtotals) {
    lines.push(`${subtotal.category}: ${formatUsd(subtotal.amountUsd)}`)
  }
  lines.push('')
  lines.push(`TOTAL: ${formatUsd(calc.totalUsd)}`)
  lines.push(formatVes(usdToVes(calc.totalUsd, budget.rate)))
  lines.push(`(Tasa Bs. ${budget.rate} por $1)`)
  return lines.join('\n')
}

/**
 * Comparte el PDF por la Web Share API con archivo adjunto cuando el
 * dispositivo lo soporta; si no, cae a un enlace wa.me con el resumen.
 */
export async function shareByWhatsApp(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<'shared' | 'whatsapp' | 'cancelled'> {
  const text = buildWhatsAppText(budget, calc)

  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const blob = await buildPdfBlob(budget, calc, clinic, options)
      const file = new File([blob], pdfFileName(budget), { type: 'application/pdf' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Presupuesto médico', text })
        return 'shared'
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Si falla el share con archivo, continuamos con el enlace de WhatsApp.
    }
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  return 'whatsapp'
}
