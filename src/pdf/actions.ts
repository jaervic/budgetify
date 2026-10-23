import { createElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { CalcResult } from '@/lib/calc'
import { downloadBlob } from '@/lib/io'
import { formatUsd, formatVes, usdToVes } from '@/lib/money'
import type { QuoteCalcResult } from '@/lib/quoteCalc'
import { formatQuoteMoney, formatQuoteOtherTotal } from '@/lib/quoteMoney'
import type { Budget, Clinic, PageSize, Quote, RateMode } from '@/types'

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

export interface QuotePdfOptions {
  pageSize: PageSize
  /** La tasa ya vive en la cotización; se acepta por simetría con el presupuesto. */
  rateMode?: RateMode
}

/** Construye el PDF de una cotización, cargando react-pdf solo al usarlo. */
export async function buildQuotePdfBlob(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  options: QuotePdfOptions,
): Promise<Blob> {
  const [{ pdf }, { QuotePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./QuotePdf'),
  ])
  const element = createElement(QuotePdf, {
    quote,
    calc,
    clinic,
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

export function quotePdfFileName(quote: Quote): string {
  return `cotizacion-${slug(quote.client.name)}-${quote.issueDate || 'borrador'}.pdf`
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

/**
 * Imprime el PDF en un solo clic.
 *
 * Se incrusta en un iframe oculto y se llama a `print()` sobre él: el diálogo
 * del sistema sale sin pasar por una pestaña nueva y sin que el usuario tenga
 * que pulsar "imprimir" otra vez. El iframe se mantiene hasta un minuto porque
 * quitarlo antes de que el usuario termine cancela el diálogo.
 *
 * En iOS (iPhone/iPad) los PDFs no se renderizan dentro de un iframe, así que
 * allí se abre en una pestaña, que es la vía fiable.
 */
export async function printBudgetPdf(
  budget: Budget,
  calc: CalcResult,
  clinic: Clinic,
  options: PdfOptions,
): Promise<void> {
  if (isAppleMobile()) {
    await openPdfInNewTab(budget, calc, clinic, options)
    return
  }

  const blob = await buildPdfBlob(budget, calc, clinic, options)
  const url = URL.createObjectURL(blob)

  const cleanup = () => {
    frame.remove()
    URL.revokeObjectURL(url)
  }

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.src = url
  frame.addEventListener('load', () => {
    const view = frame.contentWindow
    if (!view) {
      cleanup()
      void openPdfInNewTab(budget, calc, clinic, options)
      return
    }
    view.focus()
    view.print()
    window.setTimeout(cleanup, 60_000)
  })

  document.body.append(frame)
}

export async function downloadQuotePdf(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  options: QuotePdfOptions,
): Promise<void> {
  const blob = await buildQuotePdfBlob(quote, calc, clinic, options)
  downloadBlob(blob, quotePdfFileName(quote))
}

export async function openQuotePdfInNewTab(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  options: QuotePdfOptions,
): Promise<void> {
  // La pestaña se abre antes del `await` para que el bloqueador de popups no
  // la corte (mismo motivo que en el presupuesto).
  const preview = window.open('', '_blank')
  try {
    const blob = await buildQuotePdfBlob(quote, calc, clinic, options)
    const url = URL.createObjectURL(blob)
    if (preview && !preview.closed) {
      preview.location.href = url
      preview.focus()
    } else {
      downloadBlob(blob, quotePdfFileName(quote))
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    preview?.close()
    throw error
  }
}

export async function printQuotePdf(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  options: QuotePdfOptions,
): Promise<void> {
  if (isAppleMobile()) {
    await openQuotePdfInNewTab(quote, calc, clinic, options)
    return
  }

  const blob = await buildQuotePdfBlob(quote, calc, clinic, options)
  const url = URL.createObjectURL(blob)

  const cleanup = () => {
    frame.remove()
    URL.revokeObjectURL(url)
  }

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.src = url
  frame.addEventListener('load', () => {
    const view = frame.contentWindow
    if (!view) {
      cleanup()
      void openQuotePdfInNewTab(quote, calc, clinic, options)
      return
    }
    view.focus()
    view.print()
    window.setTimeout(cleanup, 60_000)
  })

  document.body.append(frame)
}

/** iPhone/iPad (incluido iPadOS, que se identifica como Mac con táctil). */
function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
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

/** Resumen de texto corto para compartir una cotización por WhatsApp. */
export function buildQuoteWhatsAppText(quote: Quote, calc: QuoteCalcResult): string {
  const lines = [
    'Cotización',
    `N.º: ${quote.number || '—'}`,
    `Cliente: ${quote.client.name || '—'}`,
    `Fecha: ${quote.issueDate}`,
    `Moneda: ${quote.currency}`,
    '',
  ]
  for (const item of calc.items) {
    lines.push(
      `${item.code ? `${item.code} · ` : ''}${item.description}: ${item.qty} × ${formatQuoteMoney(
        item.unitPriceUsd,
        quote.currency,
        quote.rate,
      )} = ${formatQuoteMoney(item.netUsd, quote.currency, quote.rate)}`,
    )
  }
  lines.push('')
  lines.push(
    `Sub-Total: ${formatQuoteMoney(calc.subtotalUsd, quote.currency, quote.rate)}`,
  )
  lines.push(`IVA: ${formatQuoteMoney(calc.taxUsd, quote.currency, quote.rate)}`)
  lines.push(`Neto: ${formatQuoteMoney(calc.totalUsd, quote.currency, quote.rate)}`)
  lines.push(formatQuoteOtherTotal(calc.totalUsd, quote.currency, quote.rate))
  lines.push(`(Tasa Bs. ${quote.rate} por $1)`)
  return lines.join('\n')
}

export async function shareQuoteByWhatsApp(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  options: QuotePdfOptions,
): Promise<'shared' | 'whatsapp' | 'cancelled'> {
  const text = buildQuoteWhatsAppText(quote, calc)

  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const blob = await buildQuotePdfBlob(quote, calc, clinic, options)
      const file = new File([blob], quotePdfFileName(quote), { type: 'application/pdf' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Cotización', text })
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
