import { useEffect, useState } from 'react'
import { Building2, HelpCircle, History, Settings2, Stethoscope } from 'lucide-react'
import { AccountButton } from '@/components/AccountButton'
import { AccountDialog } from '@/components/AccountDialog'
import { AppFooter } from '@/components/AppFooter'
import { BudgetWorkspace } from '@/components/BudgetWorkspace'
import { CatalogManagerDialog } from '@/components/CatalogManagerDialog'
import { ClinicDialog } from '@/components/ClinicDialog'
import { DocumentModeSwitch } from '@/components/DocumentModeSwitch'
import { HistoryDialog } from '@/components/HistoryDialog'
import { MergeDialog } from '@/components/MergeDialog'
import { MobileActionBar } from '@/components/MobileActionBar'
import { PasswordRecoveryDialog } from '@/components/PasswordRecoveryDialog'
import { PdfPreviewDialog } from '@/components/PdfPreviewDialog'
import { QuoteWorkspace } from '@/components/QuoteWorkspace'
import { ThemeToggle } from '@/components/ThemeToggle'
import { WELCOME_SEEN_KEY, WelcomeDialog } from '@/components/WelcomeDialog'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { usePdfActions } from '@/hooks/usePdfActions'
import { useStorageWarning } from '@/hooks/useStorageWarning'
import { useSync } from '@/hooks/useSync'
import { useTheme } from '@/hooks/useTheme'
import { useBudgetStore } from '@/store/useBudgetStore'

/** En pantallas pequeñas (móvil/tablet) el PDF se abre en pestaña nueva. */
function isCompactScreen(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1023px)').matches
    : false
}

export default function App() {
  const docMode = useBudgetStore((state) => state.docMode)
  const refreshBcvRate = useBudgetStore((state) => state.refreshBcvRate)
  const { resolved } = useTheme()
  const { openPdf } = usePdfActions()
  // Sincronización opcional: sin credenciales no hace nada ni carga Supabase.
  useSync()
  // Avisa si el navegador deja de poder guardar el borrador (cuota llena).
  useStorageWarning()

  // En móvil, "Ver PDF" abre el visor nativo del navegador; en escritorio, el modal.
  const handleViewPdf = () => {
    if (isCompactScreen()) void openPdf()
    else setPdfOpen(true)
  }

  // Al importar o limpiar, remontamos el formulario para que tome los nuevos datos.
  const [formKey, setFormKey] = useState(0)
  const [managerOpen, setManagerOpen] = useState(false)
  const [clinicOpen, setClinicOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(
    () =>
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(WELCOME_SEEN_KEY) !== '1',
  )

  const handleHelpOpenChange = (open: boolean) => {
    setHelpOpen(open)
    if (!open && typeof localStorage !== 'undefined') {
      localStorage.setItem(WELCOME_SEEN_KEY, '1')
    }
  }

  // Ancla la tasa al BCV al arrancar (una sola vez; los demás refrescos son manuales).
  useEffect(() => {
    if (useBudgetStore.getState().rateMode === 'auto') void refreshBcvRate()
  }, [refreshBcvRate])

  return (
    <div className="min-h-svh bg-muted/40">
      {/* Primer elemento enfocable de la página: sin él hay que tabular por los
          ~150 controles del formulario para llegar a las acciones del PDF. */}
      <a
        href="#acciones"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-3 focus:ring-ring/50"
      >
        Saltar a las acciones
      </a>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg leading-tight font-semibold">Budgetify</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Presupuestos médicos y cotizaciones · gratis y sin instalar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <AccountButton />
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 sm:h-9"
              aria-label="Datos de la empresa"
              onClick={() => setClinicOpen(true)}
            >
              <Building2 />
              <span aria-hidden="true" className="hidden sm:inline">
                Empresa
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 sm:h-9"
              aria-label="Historial"
              onClick={() => setHistoryOpen(true)}
            >
              <History />
              <span className="hidden sm:inline">Historial</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 sm:h-9"
              onClick={() => setManagerOpen(true)}
            >
              <Settings2 />
              <span className="hidden sm:inline">Catálogo y precios</span>
              <span className="sm:hidden">Catálogo</span>
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pb-3">
          <DocumentModeSwitch />
          <Button type="button" variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
            <HelpCircle />
            ¿Cómo se usa?
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {docMode === 'quote' ? (
          <QuoteWorkspace
            formKey={formKey}
            onDocumentReplaced={() => setFormKey((key) => key + 1)}
            onViewPdf={handleViewPdf}
          />
        ) : (
          <BudgetWorkspace
            formKey={formKey}
            onDocumentReplaced={() => setFormKey((key) => key + 1)}
            onViewPdf={handleViewPdf}
          />
        )}
      </main>

      <AppFooter />

      <MobileActionBar onViewPdf={handleViewPdf} />

      <CatalogManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
      <ClinicDialog open={clinicOpen} onOpenChange={setClinicOpen} />
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onDocumentReplaced={() => setFormKey((key) => key + 1)}
      />
      <PdfPreviewDialog open={pdfOpen} onOpenChange={setPdfOpen} />
      <WelcomeDialog open={helpOpen} onOpenChange={handleHelpOpenChange} />
      <AccountDialog />
      <MergeDialog />
      <PasswordRecoveryDialog />
      <Toaster position="top-center" theme={resolved} />
    </div>
  )
}
