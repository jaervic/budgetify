import { toast } from 'sonner'
import type { CalcResult } from '@/lib/calc'
import {
  downloadBudgetPdf,
  openPdfInNewTab,
  printBudgetPdf,
  shareByWhatsApp,
} from '@/pdf/actions'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useUiStore } from '@/store/useUiStore'

/**
 * Acciones del PDF compartidas por la barra lateral, la barra inferior de móvil
 * y la vista previa, para no duplicar lógica ni el estado de "generando".
 */
export function usePdfActions(calc: CalcResult) {
  const budget = useBudgetStore((state) => state.budget)
  const clinic = useBudgetStore((state) => state.clinic)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const pageSize = useBudgetStore((state) => state.pageSize)
  const busy = useUiStore((state) => state.pdfBusy)
  const setPdfBusy = useUiStore((state) => state.setPdfBusy)

  const options = { rateMode, pageSize }

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

  return {
    busy,
    downloadPdf: () =>
      run(() => downloadBudgetPdf(budget, calc, clinic, options), 'No se pudo generar el PDF'),
    printPdf: () =>
      run(() => printBudgetPdf(budget, calc, clinic, options), 'No se pudo imprimir'),
    openPdf: () =>
      run(() => openPdfInNewTab(budget, calc, clinic, options), 'No se pudo abrir el PDF'),
    sharePdf: () =>
      run(async () => {
        const result = await shareByWhatsApp(budget, calc, clinic, options)
        if (result === 'whatsapp') toast.info('Compartido por WhatsApp Web')
      }, 'No se pudo compartir'),
  }
}
