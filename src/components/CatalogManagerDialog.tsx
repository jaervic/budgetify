import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { CategoriesPanel } from '@/components/catalog/CategoriesPanel'
import { PacksPanel } from '@/components/catalog/PacksPanel'
import { ProductsPanel } from '@/components/catalog/ProductsPanel'
import { ServicesPanel } from '@/components/catalog/ServicesPanel'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { migrateCatalogDefaults } from '@/data/catalog'
import { downloadJson, fileStamp, parseCatalog, readJsonFile } from '@/lib/io'
import { keepOpenForToast, withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

interface CatalogManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Gestor de la biblioteca de tarifas: servicios, productos, categorías y paquetes. */
export function CatalogManagerDialog({ open, onOpenChange }: CatalogManagerDialogProps) {
  const catalog = useBudgetStore((state) => state.catalog)
  const loadCatalog = useBudgetStore((state) => state.loadCatalog)
  const resetCatalog = useBudgetStore((state) => state.resetCatalog)
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const handleExport = () => {
    downloadJson(`catalogo-${fileStamp()}.json`, catalog)
  }

  const handleImport = async (file: File) => {
    try {
      const raw = await readJsonFile(file)
      const next = parseCatalog(raw)
      // Los respaldos anteriores a las cotizaciones no traen productos: en ese
      // caso se conserva el catálogo de productos actual en lugar de vaciarlo.
      const hadProducts =
        Boolean(raw) &&
        typeof raw === 'object' &&
        Array.isArray((raw as Record<string, unknown>).products)
      if (!hadProducts) {
        const current = useBudgetStore.getState().catalog
        next.products = current.products
        next.productCatalogVersion = current.productCatalogVersion ?? 2
      }
      // Un catálogo de la versión anterior se amplía con los productos nuevos
      // al importarlo, igual que al recargar la app.
      loadCatalog(migrateCatalogDefaults(next, { seedProducts: false }))
      toast.success('Catálogo importado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el catálogo')
    }
  }

  const handleReset = () => {
    const before = useBudgetStore.getState().catalog
    withUndo({ catalog: before }, 'Catálogo restablecido', () => resetCatalog())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        onInteractOutside={keepOpenForToast}
      >
        <DialogHeader>
          <DialogTitle>Catálogo y precios</DialogTitle>
          <DialogDescription>
            Los cambios no afectan al documento que estás editando.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-full sm:h-9 sm:w-auto"
            onClick={handleExport}
          >
            <Download />
            Guardar copia
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-full sm:h-9 sm:w-auto"
            onClick={() => fileInput.current?.click()}
          >
            <Upload />
            Restaurar copia
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="col-span-2 h-10 w-full sm:col-span-1 sm:h-9 sm:w-auto"
            onClick={() => setConfirmResetOpen(true)}
          >
            <RotateCcw />
            Volver a fábrica
          </Button>
          <ConfirmDialog
            open={confirmResetOpen}
            onOpenChange={setConfirmResetOpen}
            title="¿Volver al catálogo de fábrica?"
            description={
              <p>
                Se descartan tus tarifas, categorías, áreas y paquetes editados y
                vuelven las de fábrica. Se puede deshacer desde el aviso.
              </p>
            }
            confirmLabel="Volver a fábrica"
            destructive
            onConfirm={handleReset}
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImport(file)
              event.target.value = ''
            }}
          />
        </div>

        <Tabs defaultValue="services">
          <TabsList className="catalog-tabs">
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="packs">Paquetes</TabsTrigger>
          </TabsList>
          <TabsContent value="services" className="mt-3">
            <ServicesPanel />
          </TabsContent>
          <TabsContent value="products" className="mt-3">
            <ProductsPanel />
          </TabsContent>
          <TabsContent value="categories" className="mt-3">
            <CategoriesPanel />
          </TabsContent>
          <TabsContent value="packs" className="mt-3">
            <PacksPanel />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
