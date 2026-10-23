import { useMemo, useState } from 'react'
import { PackageSearch, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatQuoteMoney, formatQuoteOtherMoney } from '@/lib/quoteMoney'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { Product } from '@/types'

interface ProductPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function filterProducts(products: Product[], query: string): Product[] {
  const term = query.trim().toLowerCase()
  if (!term) return products
  return products.filter((product) =>
    `${product.code} ${product.description}`.toLowerCase().includes(term),
  )
}

function PickerContent({ onClose }: { onClose: () => void }) {
  const products = useBudgetStore((state) => state.catalog.products)
  const currency = useBudgetStore((state) => state.quote.currency)
  const showBothCurrencies = useBudgetStore((state) => state.quote.showBothCurrencies)
  const rate = useBudgetStore((state) => state.quote.rate)
  const addQuoteProducts = useBudgetStore((state) => state.addQuoteProducts)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const visible = useMemo(() => filterProducts(products, query), [products, query])
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allVisibleSelected =
    visible.length > 0 && visible.every((product) => selectedSet.has(product.id))

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(visible.map((product) => product.id))
      setSelected((current) => current.filter((id) => !visibleIds.has(id)))
      return
    }
    setSelected((current) => [
      ...new Set([...current, ...visible.map((product) => product.id)]),
    ])
  }

  const handleAdd = () => {
    const chosen = products.filter((product) => selectedSet.has(product.id))
    if (chosen.length === 0) return
    addQuoteProducts(chosen)
    toast.success(
      chosen.length === 1
        ? `${chosen[0].description} agregado a la cotización`
        : `${chosen.length} productos agregados a la cotización`,
    )
    onClose()
  }

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por código o descripción…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={toggleAll} disabled={visible.length === 0}>
          {allVisibleSelected ? 'Quitar selección' : 'Seleccionar todos los visibles'}
        </Button>
        <Badge variant="secondary" aria-live="polite" aria-atomic="true">
          {selected.length} seleccionados
        </Badge>
      </div>

      <ScrollArea className="h-[50vh] pr-3" aria-label="Productos disponibles">
        <div className="grid gap-1.5">
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query
                ? `Sin resultados para «${query}».`
                : 'No hay productos. Créalos en «Gestionar catálogo → Productos».'}
            </p>
          )}

          {visible.map((product) => {
            const checked = selectedSet.has(product.id)
            return (
              <label
                key={product.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  aria-label={`Seleccionar ${product.code ? `${product.code} ` : ''}${product.description}`}
                  checked={checked}
                  onChange={() => toggle(product.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {product.code || '—'}
                    </span>
                    <span className="text-sm font-medium break-words">
                      {product.description}
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      {formatQuoteMoney(product.priceUsd, currency, rate)}
                      {showBothCurrencies
                        ? ` · ${formatQuoteOtherMoney(product.priceUsd, currency, rate)}`
                        : ''}
                    </span>
                    <span>{product.taxRate} % IVA</span>
                    <span>{product.unit || 'UND'}</span>
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleAdd} disabled={selected.length === 0}>
          {selected.length > 0 ? <Plus /> : <PackageSearch />}
          Agregar {selected.length > 0 ? `(${selected.length})` : 'productos'}
        </Button>
      </DialogFooter>
    </>
  )
}

/** Selector múltiple de productos del catálogo para una cotización. */
export function ProductPickerDialog({ open, onOpenChange }: ProductPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar productos</DialogTitle>
          <DialogDescription>
            Marca cada producto que quieras cotizar. Luego ajusta cantidades, precios o IVA
            en la tabla.
          </DialogDescription>
        </DialogHeader>
        {open && <PickerContent onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
