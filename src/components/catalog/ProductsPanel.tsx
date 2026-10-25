import { useEffect, useMemo, useRef, useState } from 'react'
import { PackagePlus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { HelpNote } from '@/components/HelpNote'
import { NumberInput } from '@/components/NumberInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DEFAULT_TAX_RATE } from '@/data/defaults'
import { DEFAULT_PRODUCTS, PRODUCT_CATEGORIES } from '@/data/products'
import { LIMITS } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'

const ALL = 'all'

const PRODUCT_GRID =
  'lg:grid-cols-[6rem_minmax(0,1.7fr)_8.5rem_4rem_5.5rem_4.5rem_auto]'

const UNITS = ['UND', 'CAJA', 'PAQ', 'PAR', 'FRASCO', 'TUBO', 'ROLLO', 'KIT', 'AMP', 'VIAL', 'ML', 'L']

const chipClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 min-h-11',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
  )

/**
 * Alta, edición y borrado del catálogo de productos de cotización.
 *
 * Los precios son referencias en USD y se editan en línea. Las categorías
 * agrupan la base de fábrica y también las que cree el usuario.
 */
export function ProductsPanel() {
  const products = useBudgetStore((state) => state.catalog.products)
  const addCatalogProduct = useBudgetStore((state) => state.addCatalogProduct)
  const updateCatalogProduct = useBudgetStore((state) => state.updateCatalogProduct)
  const removeCatalogProduct = useBudgetStore((state) => state.removeCatalogProduct)
  const mergeDefaultProductList = useBudgetStore((state) => state.mergeDefaultProducts)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [focusId, setFocusId] = useState<string | null>(null)
  const addProductRef = useRef<HTMLButtonElement>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  // Después de crear un producto, la lista puede ser muy larga y el scroll
  // seguir arriba. Se lleva la vista a la fila nueva y se enfoca la
  // descripción para poder escribir el nombre de inmediato.
  useEffect(() => {
    if (!focusId) return
    const node = rowRefs.current.get(focusId)
    if (!node) return

    const frame = requestAnimationFrame(() => {
      node.scrollIntoView?.({ block: 'nearest' })
      node.querySelector<HTMLInputElement>('[data-field="description"]')?.focus()
      setFocusId(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [focusId, products.length, query, activeCategory])

  const categories = useMemo(
    () =>
      [
        ...new Set([
          ...PRODUCT_CATEGORIES,
          ...products.map((product) => product.category).filter(Boolean),
        ]),
      ],
    [products],
  )

  const categoryChips =
    activeCategory !== ALL && !categories.includes(activeCategory)
      ? [...categories, activeCategory]
      : categories

  const missingDefaults = useMemo(() => {
    const existing = new Set(products.map((product) => product.id))
    return DEFAULT_PRODUCTS.filter((product) => !existing.has(product.id)).length
  }, [products])

  const term = query.trim().toLowerCase()
  const visible = products.filter((product) => {
    if (activeCategory !== ALL && product.category !== activeCategory) return false
    if (!term) return true
    return `${product.code} ${product.category} ${product.description}`
      .toLowerCase()
      .includes(term)
  })

  const handleRemove = (id: string, description: string) => {
    const before = useBudgetStore.getState().catalog
    withUndo(
      { catalog: before },
      `Producto «${description || 'sin nombre'}» eliminado`,
      () => {
        removeCatalogProduct(id)
        // El botón de borrar desaparece con la fila: el foco vuelve a un
        // punto estable del panel en vez de perderse en el body.
        requestAnimationFrame(() => addProductRef.current?.focus())
      },
    )
  }

  const handleAdd = () => {
    const created = addCatalogProduct({
      code: '',
      category: activeCategory === ALL ? PRODUCT_CATEGORIES[0] : activeCategory,
      description: 'Nuevo producto',
      unit: 'UND',
      priceUsd: 0,
      taxRate: DEFAULT_TAX_RATE,
    })
    // Si había una búsqueda escrita, el producto nuevo podría quedar oculto.
    setQuery('')
    setFocusId(created.id)
    toast.success('Producto agregado')
  }

  const handleMergeDefaults = () => {
    const added = mergeDefaultProductList()
    toast.success(
      added === 1
        ? 'Se agregó 1 producto de fábrica'
        : `Se agregaron ${added} productos de fábrica`,
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            ref={addProductRef}
            type="button"
            size="sm"
            className="h-11 w-full sm:h-9 sm:w-auto"
            onClick={handleAdd}
          >
            <Plus />
            Nuevo producto
          </Button>
          {missingDefaults > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 w-full sm:h-9 sm:w-auto"
              aria-label={`Completar catálogo (${missingDefaults} productos)`}
              onClick={handleMergeDefaults}
            >
              <PackagePlus />
              <span className="sm:hidden">Completar ({missingDefaults})</span>
              <span className="hidden sm:inline">
                Completar catálogo ({missingDefaults})
              </span>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-64">
            <Input
              className="h-11 sm:h-10"
              placeholder="Buscar código, descripción o categoría…"
              aria-label="Buscar productos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length} de {products.length} productos
          </span>
        </div>
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
        {categoryChips.map((category) => (
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

      <HelpNote title="Sobre los precios">
        <p>Son precios de referencia en dólares y puedes editarlos. Cada producto tiene su IVA.</p>
      </HelpNote>
      <p className="text-sm text-muted-foreground">
        Medicamentos: valida registro sanitario, lote y vencimiento.
      </p>

      <ScrollArea className="h-[50vh] min-h-64 pr-3" aria-label="Productos del catálogo">
        <datalist id="product-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <datalist id="product-units">
          {UNITS.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>

        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {query || activeCategory !== ALL
              ? 'No hay productos que coincidan con el filtro.'
              : 'No hay productos. Crea el primero con «Nuevo producto».'}
          </p>
        ) : (
          <>
            <div
              className={cn(
                'hidden px-3 py-1 text-sm font-medium text-muted-foreground lg:grid',
                PRODUCT_GRID,
              )}
            >
              <span>Código</span>
              <span>Descripción</span>
              <span>Categoría</span>
              <span>Unidad</span>
              <span className="text-right">Precio USD</span>
              <span className="text-right">% IVA</span>
              <span className="text-right">Acción</span>
            </div>

            <div className="grid gap-2" role="list">
              {visible.map((product) => (
                <div
                  key={product.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(product.id, node)
                    else rowRefs.current.delete(product.id)
                  }}
                  role="listitem"
                  className={cn(
                    'grid grid-cols-2 gap-3 rounded-lg border p-3 transition-colors hover:border-primary/30',
                    'lg:items-center lg:gap-0 lg:px-0 lg:py-0',
                    PRODUCT_GRID,
                  )}
                >
                <div className="grid gap-1 max-lg:order-1 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">Código</span>
                  <Input
                    className="h-10"
                    aria-label={`Código de ${product.description || 'producto'}`}
                    placeholder="Código"
                    maxLength={LIMITS.productCode}
                    value={product.code}
                    onChange={(event) =>
                      updateCatalogProduct(product.id, { code: event.target.value })
                    }
                  />
                </div>

                <div className="grid gap-1 max-lg:order-3 max-lg:col-span-2 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">
                    Descripción
                  </span>
                  <Input
                    className="h-10 font-medium"
                    data-field="description"
                    aria-label={`Descripción de ${product.description || 'producto'}`}
                    placeholder="Descripción"
                    maxLength={LIMITS.productDescription}
                    value={product.description}
                    onChange={(event) =>
                      updateCatalogProduct(product.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-1 max-lg:order-2 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">
                    Categoría
                  </span>
                  <Input
                    className="h-10"
                    aria-label={`Categoría de ${product.description || 'producto'}`}
                    placeholder="Categoría"
                    list="product-categories"
                    maxLength={LIMITS.productCategory}
                    value={product.category}
                    onChange={(event) =>
                      updateCatalogProduct(product.id, {
                        category: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-1 max-lg:order-4 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">Unidad</span>
                  <Input
                    className="h-10 text-center"
                    aria-label={`Unidad de ${product.description || 'producto'}`}
                    placeholder="UND"
                    list="product-units"
                    maxLength={LIMITS.productUnit}
                    value={product.unit}
                    onChange={(event) =>
                      updateCatalogProduct(product.id, { unit: event.target.value })
                    }
                  />
                </div>

                <div className="grid gap-1 max-lg:order-5 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">
                    Precio USD
                  </span>
                  <NumberInput
                    className="h-10"
                    aria-label={`Precio en USD de ${product.description || 'producto'}`}
                    decimals={2}
                    value={product.priceUsd}
                    onValueChange={(priceUsd) =>
                      updateCatalogProduct(product.id, { priceUsd })
                    }
                  />
                </div>

                <div className="grid gap-1 max-lg:order-6 lg:px-3 lg:py-2">
                  <span className="text-sm text-muted-foreground lg:hidden">% IVA</span>
                  <NumberInput
                    className="h-10"
                    aria-label={`Porcentaje de IVA de ${product.description || 'producto'}`}
                    decimals={2}
                    value={product.taxRate}
                    onValueChange={(taxRate) =>
                      updateCatalogProduct(product.id, {
                        taxRate: Math.min(100, taxRate),
                      })
                    }
                  />
                </div>

                <div className="flex justify-end max-lg:order-7 lg:px-2 lg:py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-10 text-destructive hover:text-destructive lg:size-9"
                    aria-label={`Eliminar ${product.description || 'producto'}`}
                    onClick={() => handleRemove(product.id, product.description)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  )
}
