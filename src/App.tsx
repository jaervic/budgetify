import { useEffect, useMemo, useState } from 'react'
import { Building2, Layers, ListPlus, Plus, Settings2 } from 'lucide-react'
import { ActionBar } from '@/components/ActionBar'
import { AppFooter } from '@/components/AppFooter'
import { CatalogManagerDialog } from '@/components/CatalogManagerDialog'
import { CatalogPickerDialog } from '@/components/CatalogPickerDialog'
import { ClinicDialog } from '@/components/ClinicDialog'
import { DataForm } from '@/components/DataForm'
import { DocumentPreview } from '@/components/DocumentPreview'
import { ItemsTable } from '@/components/ItemsTable'
import { MobileActionBar } from '@/components/MobileActionBar'
import { NotesEditor } from '@/components/NotesEditor'
import { PackPickerDialog } from '@/components/PackPickerDialog'
import { PdfPreviewDialog } from '@/components/PdfPreviewDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TotalsPanel } from '@/components/TotalsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { specialtyName } from '@/data/specialties'
import { useCalc } from '@/hooks/useCalc'
import { usePdfActions } from '@/hooks/usePdfActions'
import { useTheme } from '@/hooks/useTheme'
import { buildDocumentModel } from '@/lib/document'
import { useBudgetStore } from '@/store/useBudgetStore'

type View = 'edit' | 'preview'

/** En pantallas pequeñas (móvil/tablet) el PDF se abre en pestaña nueva. */
function isCompactScreen(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1023px)').matches
    : false
}

export default function App() {
  const calc = useCalc()
  const budget = useBudgetStore((state) => state.budget)
  const clinic = useBudgetStore((state) => state.clinic)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const pageSize = useBudgetStore((state) => state.pageSize)
  const refreshBcvRate = useBudgetStore((state) => state.refreshBcvRate)
  const catalog = useBudgetStore((state) => state.catalog)
  const defaultCategory = useBudgetStore((state) => state.catalog.categories[0] ?? 'General')
  const addManualItem = useBudgetStore((state) => state.addManualItem)
  const { resolved } = useTheme()
  const { openPdf } = usePdfActions(calc)

  // En móvil, "Ver PDF" abre el visor nativo del navegador; en escritorio, el modal.
  const handleViewPdf = () => {
    if (isCompactScreen()) void openPdf()
    else setPdfOpen(true)
  }

  const hasItems = calc.items.length > 0
  const model = useMemo(
    () =>
      buildDocumentModel(budget, calc, clinic, {
        rateMode,
        pageSize,
        specialtyName: specialtyName(clinic.specialtyId, catalog.specialties),
      }),
    [budget, calc, clinic, rateMode, pageSize, catalog.specialties],
  )

  const [view, setView] = useState<View>('edit')
  // Al importar o limpiar, remontamos el formulario para que tome los nuevos datos.
  const [formKey, setFormKey] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [packOpen, setPackOpen] = useState(false)
  const [clinicOpen, setClinicOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)

  // Ancla la tasa al BCV al arrancar (una sola vez; los demás refrescos son manuales).
  useEffect(() => {
    if (useBudgetStore.getState().rateMode === 'auto') void refreshBcvRate()
  }, [refreshBcvRate])

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg leading-tight font-semibold">
                <span className="sm:hidden">Presupuestos</span>
                <span className="hidden sm:inline">Presupuestos Médicos</span>
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Budgetify · gratis y sin instalar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setClinicOpen(true)}
            >
              <Building2 />
              Clínica
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManagerOpen(true)}
            >
              <Settings2 />
              <span className="hidden sm:inline">Gestionar catálogo</span>
              <span className="sm:hidden">Catálogo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_340px]">
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
                      Ajusta concepto, detalle, categoría, cantidad o precio de cada línea.
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
                      Cargar plantilla
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
                    <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                      <Plus />
                      Agregar servicio
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hasItems ? (
                  <ItemsTable calc={calc} rate={budget.rate} />
                ) : (
                  <div className="grid place-items-center gap-3 rounded-lg border border-dashed py-12 text-center">
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Aún no hay servicios. Agrega del catálogo, carga una plantilla o crea
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

        <aside className="grid content-start gap-4 lg:sticky lg:top-4">
          <TotalsPanel calc={calc} rate={budget.rate} />
          <ActionBar
            calc={calc}
            onBudgetReplaced={() => setFormKey((key) => key + 1)}
            onViewPdf={handleViewPdf}
          />
        </aside>
      </main>

      <AppFooter />

      <MobileActionBar calc={calc} onViewPdf={handleViewPdf} />

      <CatalogPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      <PackPickerDialog open={packOpen} onOpenChange={setPackOpen} />
      <CatalogManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
      <ClinicDialog open={clinicOpen} onOpenChange={setClinicOpen} />
      <PdfPreviewDialog open={pdfOpen} onOpenChange={setPdfOpen} />
      <Toaster position="top-center" theme={resolved} />
    </div>
  )
}
