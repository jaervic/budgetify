import { useMemo } from 'react'
import { computeBudget } from '@/lib/calc'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Resultado del cálculo, memorizado sobre los ítems del presupuesto. */
export function useCalc() {
  const items = useBudgetStore((state) => state.budget.items)
  return useMemo(() => computeBudget(items), [items])
}

/** Categorías presentes en el presupuesto, en orden de aparición. */
export function useCategories() {
  const items = useBudgetStore((state) => state.budget.items)
  return useMemo(() => {
    const seen: string[] = []
    for (const item of items) {
      if (!seen.includes(item.category)) seen.push(item.category)
    }
    return seen
  }, [items])
}
