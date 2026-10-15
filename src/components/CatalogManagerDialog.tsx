import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { CategoriesPanel } from '@/components/catalog/CategoriesPanel'
import { PacksPanel } from '@/components/catalog/PacksPanel'
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
import { downloadJson, fileStamp, parseCatalog, readJsonFile } from '@/lib/io'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

interface CatalogManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Gestor de la biblioteca de tarifas: servicios, categorías y plantillas. */
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
      const next = parseCatalog(await readJsonFile(file))
      loadCatalog(next)
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Catálogo de la clínica</DialogTitle>
          <DialogDescription>
            Edita la biblioteca de tarifas. Los cambios no afectan al presupuesto actual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download />
            Exportar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <Upload />
            Importar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmResetOpen(true)}>
            <RotateCcw />
            Restablecer
          </Button>
          <ConfirmDialog
            open={confirmResetOpen}
            onOpenChange={setConfirmResetOpen}
            title="¿Restablecer el catálogo?"
            description={
              <p>
                Se descartan tus tarifas, categorías, áreas y plantillas editadas y
                vuelven las de fábrica. Se puede deshacer desde el aviso.
              </p>
            }
            confirmLabel="Restablecer catálogo"
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
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="packs">Plantillas</TabsTrigger>
          </TabsList>
          <TabsContent value="services" className="mt-3">
            <ServicesPanel />
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
