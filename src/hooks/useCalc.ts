import { useMemo } from 'react'
import { computeBudget } from '@/lib/calc'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Resultado del cálculo, memorizado sobre los ítems del presupuesto. */
export function useCalc() {
  const items = useBudgetStore((state) => state.budget.items)
  return useMemo(() => computeBudget(items), [items])
}
