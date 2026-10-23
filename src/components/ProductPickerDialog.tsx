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
import { DEFAULT_PRODUCTS, PRODUCT_CATEGORIES } from '@/data/products'
import { formatQuoteMoney, formatQuoteOtherMoney } from '@/lib/quoteMoney'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ALL = 'all'

const chipClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
  )

function PickerContent({ onClose }: { onClose: () => void }) {
  const products = useBudgetStore((state) => state.catalog.products)
  const currency = useBudgetStore((state) => state.quote.currency)
  const showBothCurrencies = useBudgetStore((state) => state.quote.showBothCurrencies)
  const rate = useBudgetStore((state) => state.quote.rate)
  const addQuoteProducts = useBudgetStore((state) => state.addQuoteProducts)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [selected, setSelected] = useState<string[]>([])

  const categoryOrder = useMemo(
    () =>
      new Map<string, number>(
        PRODUCT_CATEGORIES.map((category, index) => [category, index]),
      ),
    [],
  )

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category).filter(Boolean))].sort(
        (a, b) =>
          (categoryOrder.get(a) ?? Number.MAX_SAFE_INTEGER) -
          (categoryOrder.get(b) ?? Number.MAX_SAFE_INTEGER),
      ),
    [products, categoryOrder],
  )

  // Los productos creados por el usuario no están en la base de fábrica. Se
  // muestran primero para que el alta reciente no quede al final de una lista
  // larga y parezca que no se guardó.
  const defaultIds = useMemo(
    () => new Set(DEFAULT_PRODUCTS.map((product) => product.id)),
    [],
  )
  const orderedProducts = useMemo(() => {
    const custom = products.filter((product) => !defaultIds.has(product.id))
    const factory = products.filter((product) => defaultIds.has(product.id))
    return [...custom, ...factory]
  }, [products, defaultIds])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return orderedProducts.filter((product) => {
      if (activeCategory !== ALL && product.category !== activeCategory) return false
      if (!term) return true
      return `${product.code} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(term)
    })
  }, [orderedProducts, query, activeCategory])

  const groups = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const product of visible) {
      const list = map.get(product.category)
      if (list) list.push(product)
      else map.set(product.category, [product])
    }
    return [...map.entries()]
  }, [visible])

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
    const chosen = orderedProducts.filter((product) => selectedSet.has(product.id))
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
          placeholder="Buscar por código, descripción o categoría…"
          aria-label="Buscar productos para la cotización"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        role="group"
        aria-label="Filtrar productos por categoría"
      >
        <button
          type="button"
          className={chipClass(activeCategory === ALL)}
          aria-pressed={activeCategory === ALL}
          onClick={() => setActiveCategory(ALL)}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={chipClass(activeCategory === category)}
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={visible.length === 0}
          >
            {allVisibleSelected ? 'Quitar selección' : 'Seleccionar todos los visibles'}
          </Button>
          {(query.trim() !== '' || activeCategory !== ALL) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setActiveCategory(ALL)
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length} de {products.length} productos
          </span>
          <Badge variant="secondary" aria-live="polite" aria-atomic="true">
            {selected.length} seleccionados
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[52vh] min-h-64 pr-3" aria-label="Productos disponibles">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {query || activeCategory !== ALL
              ? 'No hay productos que coincidan con el filtro.'
              : 'No hay productos. Créalos en «Catálogo y precios → Productos».'}
          </p>
        ) : (
          <div className="grid gap-4">
            {groups.map(([category, items]) => (
              <section key={category} className="grid gap-1.5">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {category || 'Sin categoría'}{' '}
                  <span className="font-normal">({items.length})</span>
                </h3>
                {items.map((product) => {
                  const checked = selectedSet.has(product.id)
                  return (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-5 shrink-0 accent-primary"
                        aria-label={`Seleccionar ${product.code ? `${product.code} ` : ''}${product.description}`}
                        checked={checked}
                        onChange={() => toggle(product.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {product.code || '—'}
                          </span>
                          <span className="text-sm font-medium break-words">
                            {product.description}
                          </span>
                          {!defaultIds.has(product.id) && (
                            <Badge variant="outline" className="text-xs">
                              Personalizado
                            </Badge>
                          )}
                        </span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
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
              </section>
            ))}
          </div>
        )}
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar productos</DialogTitle>
          <DialogDescription>
            Marca los productos que quieras cotizar.
          </DialogDescription>
        </DialogHeader>
        {open && <PickerContent onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
