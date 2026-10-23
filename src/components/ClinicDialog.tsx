import { useRef, useState } from 'react'
import { Building2, ImagePlus, Stethoscope, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SpecialtySelect } from '@/components/SpecialtySelect'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DOCTOR_TITLES, doctorFullName, specialtyName } from '@/data/specialties'
import { LIMITS } from '@/lib/limits'
import { fileToLogoDataUrl } from '@/lib/logo'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  label: string
  value?: string
  onFile: (file: File) => void | Promise<void>
  onClear: () => void
  busy?: boolean
  /** Clases del recuadro de vista previa. */
  previewClassName?: string
}

/** Subida de imagen con vista previa (logo, firma o sello). */
function ImageUpload({
  label,
  value,
  onFile,
  onClear,
  busy,
  previewClassName,
}: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/40',
            previewClassName ?? 'size-20',
          )}
        >
          {value ? (
            <img
              src={value}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <ImagePlus />
            {value ? 'Cambiar' : 'Subir'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onClear}
            >
              <Trash2 />
              Quitar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onFile(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}

interface ClinicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Datos de la clínica (identificación, contacto, logo, firma y sello). */
export function ClinicDialog({ open, onOpenChange }: ClinicDialogProps) {
  const clinic = useBudgetStore((state) => state.clinic)
  const docMode = useBudgetStore((state) => state.docMode)
  const setClinic = useBudgetStore((state) => state.setClinic)
  const catalog = useBudgetStore((state) => state.catalog)
  const [busy, setBusy] = useState(false)
  const areaName = specialtyName(clinic.specialtyId, catalog.specialties)

  const uploadImage =
    (field: 'logoDataUrl' | 'signatureDataUrl' | 'sealDataUrl', success: string) =>
    async (file: File) => {
      setBusy(true)
      try {
        setClinic({ [field]: await fileToLogoDataUrl(file) })
        toast.success(success)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar la imagen')
      } finally {
        setBusy(false)
      }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Datos de la empresa</DialogTitle>
          <DialogDescription>
            {docMode === 'quote'
              ? 'Encabezan la cotización y su PDF. Se guardan solo en este navegador.'
              : 'Encabezan el presupuesto y su PDF. Se guardan solo en este navegador.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {docMode === 'budget' && (
            <div className="grid gap-2">
              <Label>El documento es de</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={clinic.headerMode === 'professional' ? 'outline' : 'default'}
                  aria-pressed={clinic.headerMode !== 'professional'}
                  onClick={() => setClinic({ headerMode: 'clinic' })}
                >
                  <Building2 />
                  Clínica / Centro médico
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={clinic.headerMode === 'professional' ? 'default' : 'outline'}
                  aria-pressed={clinic.headerMode === 'professional'}
                  onClick={() => setClinic({ headerMode: 'professional' })}
                >
                  <Stethoscope />
                  Profesional independiente
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {clinic.headerMode === 'professional'
                  ? 'La hoja se encabeza con tu nombre, tu título y tu área de práctica.'
                  : 'La hoja se encabeza con el nombre de la clínica o empresa.'}
              </p>
            </div>
          )}

          {(docMode === 'quote' || clinic.headerMode !== 'professional') && (
            <div className="grid gap-2">
              <Label htmlFor="clinic-name">Nombre de la clínica o empresa</Label>
              <Input
                id="clinic-name"
                maxLength={LIMITS.clinicName}
                value={clinic.name}
                placeholder="Clínica, centro médico o empresa"
                onChange={(event) => setClinic({ name: event.target.value })}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="clinic-rif">RIF</Label>
              <Input
                id="clinic-rif"
                maxLength={LIMITS.clinicRif}
                placeholder="J-12345678-9"
                value={clinic.rif}
                onChange={(event) => setClinic({ rif: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clinic-phone">Teléfono</Label>
              <Input
                id="clinic-phone"
                maxLength={LIMITS.clinicPhone}
                placeholder="0244-3210389"
                value={clinic.phone ?? ''}
                onChange={(event) =>
                  setClinic({ phone: event.target.value || undefined })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clinic-address">Dirección</Label>
            <Input
              id="clinic-address"
              maxLength={LIMITS.clinicAddress}
              placeholder="Dirección de la clínica"
              value={clinic.address ?? ''}
              onChange={(event) =>
                setClinic({ address: event.target.value || undefined })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clinic-email">Email</Label>
            <Input
              id="clinic-email"
              maxLength={LIMITS.clinicEmail}
              type="email"
              placeholder="contacto@clinica.com"
              value={clinic.email ?? ''}
              onChange={(event) =>
                setClinic({ email: event.target.value || undefined })
              }
            />
          </div>

          {docMode === 'budget' && (
            <div className="grid gap-4 border-t pt-4">
              <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <div className="grid gap-2">
                  <Label htmlFor="clinic-doctor-title">Título</Label>
                <Input
                  id="clinic-doctor-title"
                  maxLength={LIMITS.doctorTitle}
                  list="doctor-titles"
                  placeholder="Dr."
                  value={clinic.doctorTitle ?? ''}
                  onChange={(event) =>
                    setClinic({ doctorTitle: event.target.value || undefined })
                  }
                />
                <datalist id="doctor-titles">
                  {DOCTOR_TITLES.map((title) => (
                    <option key={title} value={title} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clinic-doctor">Profesional tratante</Label>
                <Input
                  id="clinic-doctor"
                  maxLength={LIMITS.doctorName}
                  placeholder="Nombre Apellido"
                  value={clinic.doctorName ?? ''}
                  onChange={(event) =>
                    setClinic({ doctorName: event.target.value || undefined })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="clinic-specialty">Área de práctica</Label>
                <SpecialtySelect
                  id="clinic-specialty"
                  specialties={catalog.specialties}
                  value={clinic.specialtyId}
                  noneLabel="Sin área"
                  onChange={(specialtyId) => setClinic({ specialtyId })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clinic-doctor-id">MPPS / Colegio</Label>
                <Input
                  id="clinic-doctor-id"
                  maxLength={LIMITS.doctorId}
                  placeholder="MPPS 12345 / CM 6789"
                  value={clinic.doctorId ?? ''}
                  onChange={(event) =>
                    setClinic({ doctorId: event.target.value || undefined })
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {clinic.headerMode === 'professional' ? 'Encabezado: ' : 'Firma: '}
              <b>{doctorFullName(clinic.doctorTitle, clinic.doctorName) || 'sin nombre'}</b>
              {areaName ? ` — ${areaName}` : ''}
              {clinic.headerMode === 'professional'
                ? '. El catálogo se filtra por esta área.'
                : '. Pon el título y el nombre del profesional que firma.'}
              </p>
            </div>
          )}

          <div className="grid gap-4 border-t pt-4">
            <ImageUpload
              label="Logo (PNG o JPG)"
              value={clinic.logoDataUrl}
              busy={busy}
              onFile={uploadImage('logoDataUrl', 'Logo actualizado')}
              onClear={() => setClinic({ logoDataUrl: undefined })}
            />

            {docMode === 'budget' && (
              <>
                <ImageUpload
                  label="Firma del médico (PNG o JPG)"
                  value={clinic.signatureDataUrl}
                  busy={busy}
                  previewClassName="h-16 w-40"
                  onFile={uploadImage('signatureDataUrl', 'Firma actualizada')}
                  onClear={() => setClinic({ signatureDataUrl: undefined })}
                />

                <ImageUpload
                  label="Sello de la clínica (PNG o JPG)"
                  value={clinic.sealDataUrl}
                  busy={busy}
                  onFile={uploadImage('sealDataUrl', 'Sello actualizado')}
                  onClear={() => setClinic({ sealDataUrl: undefined })}
                />

                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={clinic.showSignature !== false}
                    onChange={(event) =>
                      setClinic({ showSignature: event.target.checked })
                    }
                  />
                  Mostrar bloque de firmas en el documento
                </label>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
