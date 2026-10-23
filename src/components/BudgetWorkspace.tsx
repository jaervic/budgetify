import { useMemo, useRef, useState } from 'react'
import { Layers, ListPlus, Plus } from 'lucide-react'
import { ActionBar } from '@/components/ActionBar'
import { CatalogPickerDialog } from '@/components/CatalogPickerDialog'
import { DataForm } from '@/components/DataForm'
import { DocumentPreview } from '@/components/DocumentPreview'
import { ItemsTable } from '@/components/ItemsTable'
import { NotesEditor } from '@/components/NotesEditor'
import { PackPickerDialog } from '@/components/PackPickerDialog'
import { TotalsPanel } from '@/components/TotalsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { specialtyName } from '@/data/specialties'
import { useCalc } from '@/hooks/useCalc'
import { buildDocumentModel } from '@/lib/document'
import { useBudgetStore } from '@/store/useBudgetStore'

type View = 'edit' | 'preview'

interface BudgetWorkspaceProps {
  /** Cambia al importar o limpiar para que el formulario tome los datos nuevos. */
  formKey: number
  onDocumentReplaced: () => void
  onViewPdf: () => void
}

/** Editor y vista previa del presupuesto médico. */
export function BudgetWorkspace({
  formKey,
  onDocumentReplaced,
  onViewPdf,
}: BudgetWorkspaceProps) {
  const calc = useCalc()
  const budget = useBudgetStore((state) => state.budget)
  const clinic = useBudgetStore((state) => state.clinic)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const pageSize = useBudgetStore((state) => state.pageSize)
  const specialties = useBudgetStore((state) => state.catalog.specialties)
  const defaultCategory = useBudgetStore(
    (state) => state.catalog.categories[0] ?? 'General',
  )
  const addManualItem = useBudgetStore((state) => state.addManualItem)
  const [view, setView] = useState<View>('edit')

  const model = useMemo(
    () =>
      buildDocumentModel(budget, calc, clinic, {
        rateMode,
        pageSize,
        specialtyName: specialtyName(clinic.specialtyId, specialties),
      }),
    [budget, calc, clinic, rateMode, pageSize, specialties],
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [packOpen, setPackOpen] = useState(false)
  const addServiceRef = useRef<HTMLButtonElement>(null)

  const hasItems = calc.items.length > 0

  return (
    <>
      <Tabs value={view} onValueChange={(value) => setView(value as View)}>
        <TabsList>
          <TabsTrigger value="edit">Edición</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 grid content-start gap-4">
          <DataForm key={formKey} />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Servicios</CardTitle>
                  <CardDescription>
                    Puedes editar cada línea directamente.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPackOpen(true)}
                  >
                    <Layers />
                    Cargar paquete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addManualItem(defaultCategory)}
                  >
                    <ListPlus />
                    Línea manual
                  </Button>
                  <Button
                    ref={addServiceRef}
                    type="button"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus />
                    Agregar servicio
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasItems ? (
                <ItemsTable calc={calc} rate={budget.rate} emptyFocusRef={addServiceRef} />
              ) : (
                <div className="grid place-items-center gap-3 rounded-lg border border-dashed py-12 text-center">
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Aún no hay servicios. Agrega del catálogo, carga un paquete o crea
                    líneas manuales para armar el presupuesto.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                      <Plus />
                      Agregar servicio
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addManualItem(defaultCategory)}
                    >
                      <ListPlus />
                      Añadir línea manual
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <NotesEditor />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <DocumentPreview model={model} />
        </TabsContent>
      </Tabs>

      <aside
        id="acciones"
        tabIndex={-1}
        className="grid content-start gap-4 outline-none lg:sticky lg:top-4"
      >
        <TotalsPanel calc={calc} rate={budget.rate} />
        <ActionBar onDocumentReplaced={onDocumentReplaced} onViewPdf={onViewPdf} />
      </aside>

      <CatalogPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      <PackPickerDialog open={packOpen} onOpenChange={setPackOpen} />
    </>
  )
}
