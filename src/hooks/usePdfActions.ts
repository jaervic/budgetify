import { toast } from 'sonner'
import { computeBudget } from '@/lib/calc'
import { computeQuote } from '@/lib/quoteCalc'
import {
  buildPdfBlob,
  buildQuotePdfBlob,
  downloadBudgetPdf,
  downloadQuotePdf,
  openPdfInNewTab,
  openQuotePdfInNewTab,
  printBudgetPdf,
  printQuotePdf,
  shareByWhatsApp,
  shareQuoteByWhatsApp,
} from '@/pdf/actions'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useUiStore } from '@/store/useUiStore'

/**
 * Acciones del PDF del documento activo (presupuesto o cotización).
 *
 * No se suscribe al presupuesto ni a la cotización: lee el estado en el
 * momento de generar. Así escribir en un campo del formulario no vuelve a
 * renderizar las tres instancias de este hook (barra lateral, barra móvil y
 * modal) por cada pulsación.
 */
export function usePdfActions() {
  const busy = useUiStore((state) => state.pdfBusy)
  const setPdfBusy = useUiStore((state) => state.setPdfBusy)

  const run = async (action: () => Promise<void>, errorMessage: string) => {
    setPdfBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
    } finally {
      setPdfBusy(false)
    }
  }

  const snapshot = () => {
    const state = useBudgetStore.getState()
    if (state.docMode === 'quote') {
      return {
        kind: 'quote' as const,
        pageSize: state.quotePageSize,
        calc: computeQuote(state.quote.items),
        quote: state.quote,
        clinic: state.clinic,
      }
    }
    return {
      kind: 'budget' as const,
      pageSize: state.pageSize,
      calc: computeBudget(state.budget.items),
      budget: state.budget,
      clinic: state.clinic,
      rateMode: state.rateMode,
    }
  }

  /** Mismo PDF que descargan las acciones, para el modal de vista previa. */
  const buildBlob = () => {
    const current = snapshot()
    return current.kind === 'quote'
      ? buildQuotePdfBlob(current.quote, current.calc, current.clinic, {
          pageSize: current.pageSize,
        })
      : buildPdfBlob(current.budget, current.calc, current.clinic, {
          rateMode: current.rateMode,
          pageSize: current.pageSize,
        })
  }

  return {
    busy,
    buildBlob,
    downloadPdf: () =>
      run(() => {
        const current = snapshot()
        return current.kind === 'quote'
          ? downloadQuotePdf(current.quote, current.calc, current.clinic, {
              pageSize: current.pageSize,
            })
          : downloadBudgetPdf(current.budget, current.calc, current.clinic, {
              rateMode: current.rateMode,
              pageSize: current.pageSize,
            })
      }, 'No se pudo generar el PDF'),
    printPdf: () =>
      run(() => {
        const current = snapshot()
        return current.kind === 'quote'
          ? printQuotePdf(current.quote, current.calc, current.clinic, {
              pageSize: current.pageSize,
            })
          : printBudgetPdf(current.budget, current.calc, current.clinic, {
              rateMode: current.rateMode,
              pageSize: current.pageSize,
            })
      }, 'No se pudo imprimir'),
    openPdf: () =>
      run(() => {
        const current = snapshot()
        return current.kind === 'quote'
          ? openQuotePdfInNewTab(current.quote, current.calc, current.clinic, {
              pageSize: current.pageSize,
            })
          : openPdfInNewTab(current.budget, current.calc, current.clinic, {
              rateMode: current.rateMode,
              pageSize: current.pageSize,
            })
      }, 'No se pudo abrir el PDF'),
    sharePdf: () =>
      run(async () => {
        const current = snapshot()
        const result =
          current.kind === 'quote'
            ? await shareQuoteByWhatsApp(current.quote, current.calc, current.clinic, {
                pageSize: current.pageSize,
              })
            : await shareByWhatsApp(current.budget, current.calc, current.clinic, {
                rateMode: current.rateMode,
                pageSize: current.pageSize,
              })
        if (result === 'whatsapp') toast.info('Compartido por WhatsApp Web')
      }, 'No se pudo compartir'),
  }
}
