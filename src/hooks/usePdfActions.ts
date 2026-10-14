import { useState } from 'react'
import { toast } from 'sonner'
import type { CalcResult } from '@/lib/calc'
import {
  downloadBudgetPdf,
  openPdfInNewTab,
  printBudgetPdf,
  shareByWhatsApp,
} from '@/pdf/actions'
import { useBudgetStore } from '@/store/useBudgetStore'

/**
 * Acciones del PDF compartidas por la barra lateral y la barra inferior de
 * móvil, para no duplicar lógica ni el estado de "generando".
 */
export function usePdfActions(calc: CalcResult) {
  const budget = useBudgetStore((state) => state.budget)
  const clinic = useBudgetStore((state) => state.clinic)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const pageSize = useBudgetStore((state) => state.pageSize)
  const [busy, setBusy] = useState(false)

  const options = { rateMode, pageSize }

  const run = async (action: () => Promise<void>, errorMessage: string) => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
    } finally {
      setBusy(false)
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
