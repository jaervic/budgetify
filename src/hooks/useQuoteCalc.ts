import { useMemo } from 'react'
import { computeQuote } from '@/lib/quoteCalc'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Resultado del cálculo de la cotización, memorizado sobre sus líneas. */
export function useQuoteCalc() {
  const items = useBudgetStore((state) => state.quote.items)
  return useMemo(() => computeQuote(items), [items])
}
