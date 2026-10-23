import { useMemo, useRef, useState } from 'react'
import { ListPlus, Plus } from 'lucide-react'
import { ProductPickerDialog } from '@/components/ProductPickerDialog'
import { QuoteActionBar } from '@/components/QuoteActionBar'
import { QuoteDataForm } from '@/components/QuoteDataForm'
import { QuoteItemsTable } from '@/components/QuoteItemsTable'
import { QuotePreview } from '@/components/QuotePreview'
import { QuoteTotalsPanel } from '@/components/QuoteTotalsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuoteCalc } from '@/hooks/useQuoteCalc'
import { buildQuoteDocumentModel } from '@/lib/quoteDocument'
import { useBudgetStore } from '@/store/useBudgetStore'

type View = 'edit' | 'preview'

interface QuoteWorkspaceProps {
  /** Cambia al importar o limpiar para remontar el formulario con datos nuevos. */
  formKey: number
  /** Se llama tras importar o limpiar una cotización. */
  onDocumentReplaced: () => void
  /** Abre el PDF (modal en escritorio, pestaña nueva en móvil). */
  onViewPdf: () => void
}

/** Editor y vista previa de la cotización de productos. */
export function QuoteWorkspace({
  formKey,
  onDocumentReplaced,
  onViewPdf,
}: QuoteWorkspaceProps) {
  const calc = useQuoteCalc()
  const quote = useBudgetStore((state) => state.quote)
  const clinic = useBudgetStore((state) => state.clinic)
  const pageSize = useBudgetStore((state) => state.quotePageSize)
  const addManualQuoteItem = useBudgetStore((state) => state.addManualQuoteItem)
  const [view, setView] = useState<View>('edit')
  const [pickerOpen, setPickerOpen] = useState(false)
  const addProductsRef = useRef<HTMLButtonElement>(null)

  const model = useMemo(
    () => buildQuoteDocumentModel(quote, calc, clinic, pageSize),
    [quote, calc, clinic, pageSize],
  )

  const hasItems = calc.items.length > 0

  return (
    <>
      <Tabs value={view} onValueChange={(value) => setView(value as View)}>
        <TabsList>
          <TabsTrigger value="edit">Edición</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 grid content-start gap-4">
          <QuoteDataForm key={formKey} />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>
                    Puedes editar cada línea directamente.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addManualQuoteItem()}
                  >
                    <ListPlus />
                    Línea manual
                  </Button>
                  <Button
                    ref={addProductsRef}
                    type="button"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus />
                    Agregar productos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasItems ? (
                <QuoteItemsTable calc={calc} emptyFocusRef={addProductsRef} />
              ) : (
                <div className="grid place-items-center gap-3 rounded-lg border border-dashed py-12 text-center">
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Aún no hay productos. Elige los que quieras cotizar del catálogo o crea
                    una línea manual.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                      <Plus />
                      Agregar productos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addManualQuoteItem()}
                    >
                      <ListPlus />
                      Añadir línea manual
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <QuotePreview model={model} />
        </TabsContent>
      </Tabs>

      <aside
        id="acciones"
        tabIndex={-1}
        className="grid content-start gap-4 outline-none lg:sticky lg:top-4"
      >
        <QuoteTotalsPanel
          calc={calc}
          rate={quote.rate}
          currency={quote.currency}
          showBothCurrencies={quote.showBothCurrencies}
        />
        <QuoteActionBar onDocumentReplaced={onDocumentReplaced} onViewPdf={onViewPdf} />
      </aside>

      <ProductPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  )
}
