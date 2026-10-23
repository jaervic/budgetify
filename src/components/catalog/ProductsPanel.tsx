import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { NumberInput } from '@/components/NumberInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DEFAULT_TAX_RATE } from '@/data/defaults'
import { LIMITS } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Alta, edición y borrado del catálogo de productos de cotización. */
export function ProductsPanel() {
  const products = useBudgetStore((state) => state.catalog.products)
  const addCatalogProduct = useBudgetStore((state) => state.addCatalogProduct)
  const updateCatalogProduct = useBudgetStore((state) => state.updateCatalogProduct)
  const removeCatalogProduct = useBudgetStore((state) => state.removeCatalogProduct)
  const [query, setQuery] = useState('')
  const addProductRef = useRef<HTMLButtonElement>(null)

  const term = query.trim().toLowerCase()
  const visible = term
    ? products.filter((product) =>
        `${product.code} ${product.description}`.toLowerCase().includes(term),
      )
    : products

  const handleRemove = (id: string, description: string) => {
    const before = useBudgetStore.getState().catalog
    withUndo(
      { catalog: before },
      `Producto «${description || 'sin nombre'}» eliminado`,
      () => {
        removeCatalogProduct(id)
        // El botón de borrar desaparece con la tarjeta: el foco vuelve a un
        // punto estable del panel en vez de perderse en el body.
        requestAnimationFrame(() => addProductRef.current?.focus())
      },
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          ref={addProductRef}
          type="button"
          size="sm"
          onClick={() =>
            addCatalogProduct({
              code: '',
              description: 'Nuevo producto',
              unit: 'UND',
              priceUsd: 0,
              taxRate: DEFAULT_TAX_RATE,
            })
          }
        >
          <Plus />
          Nuevo producto
        </Button>
        <div className="w-full sm:w-64">
          <Input
            className="h-8 text-xs"
            placeholder="Buscar por código o descripción…"
            aria-label="Buscar productos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {visible.length} de {products.length} productos
        </span>
      </div>

      <ScrollArea className="h-[42vh] pr-3" aria-label="Productos del catálogo">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {query
              ? `Sin resultados para «${query}».`
              : 'No hay productos. Crea el primero con «Nuevo producto».'}
          </p>
        ) : (
          <div className="grid gap-2" role="list">
            {visible.map((product) => (
            <div
              key={product.id}
              role="listitem"
              className="grid gap-2 rounded-lg border p-3"
            >
              <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_5rem]">
                <Input
                  className="h-8"
                  aria-label="Código"
                  placeholder="Código"
                  maxLength={LIMITS.productCode}
                  value={product.code}
                  onChange={(event) =>
                    updateCatalogProduct(product.id, { code: event.target.value })
                  }
                />
                <Input
                  className="h-8 font-medium"
                  aria-label="Descripción"
                  placeholder="Descripción"
                  maxLength={LIMITS.productDescription}
                  value={product.description}
                  onChange={(event) =>
                    updateCatalogProduct(product.id, { description: event.target.value })
                  }
                />
                <Input
                  className="h-8 text-center"
                  aria-label="Unidad"
                  placeholder="UND"
                  maxLength={LIMITS.productUnit}
                  value={product.unit}
                  onChange={(event) =>
                    updateCatalogProduct(product.id, { unit: event.target.value })
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Precio USD
                  <NumberInput
                    className="h-8 w-24"
                    aria-label="Precio en USD"
                    decimals={2}
                    value={product.priceUsd}
                    onValueChange={(priceUsd) =>
                      updateCatalogProduct(product.id, { priceUsd })
                    }
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  % IVA
                  <NumberInput
                    className="h-8 w-20"
                    aria-label="Porcentaje de IVA"
                    decimals={2}
                    value={product.taxRate}
                    onValueChange={(taxRate) =>
                      updateCatalogProduct(product.id, {
                        taxRate: Math.min(100, taxRate),
                      })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto text-destructive hover:text-destructive"
                  aria-label={`Eliminar ${product.description || 'producto'}`}
                  onClick={() => handleRemove(product.id, product.description)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
