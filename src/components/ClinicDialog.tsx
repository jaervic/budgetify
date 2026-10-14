import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
  const setClinic = useBudgetStore((state) => state.setClinic)
  const [busy, setBusy] = useState(false)

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
          <DialogTitle>Datos de la clínica</DialogTitle>
          <DialogDescription>
            Encabezan el presupuesto y el PDF. Se guardan solo en este navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="clinic-name">Nombre de la clínica</Label>
            <Input
              id="clinic-name"
              value={clinic.name}
              placeholder="Clínica / Centro médico"
              onChange={(event) => setClinic({ name: event.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="clinic-rif">RIF</Label>
              <Input
                id="clinic-rif"
                placeholder="J-12345678-9"
                value={clinic.rif}
                onChange={(event) => setClinic({ rif: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clinic-phone">Teléfono</Label>
              <Input
                id="clinic-phone"
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
              type="email"
              placeholder="contacto@clinica.com"
              value={clinic.email ?? ''}
              onChange={(event) =>
                setClinic({ email: event.target.value || undefined })
              }
            />
          </div>

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="clinic-doctor">Médico tratante</Label>
              <Input
                id="clinic-doctor"
                placeholder="Dr(a). Nombre Apellido"
                value={clinic.doctorName ?? ''}
                onChange={(event) =>
                  setClinic({ doctorName: event.target.value || undefined })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clinic-doctor-id">MPPS / CM</Label>
              <Input
                id="clinic-doctor-id"
                placeholder="MPPS 12345 / CM 6789"
                value={clinic.doctorId ?? ''}
                onChange={(event) =>
                  setClinic({ doctorId: event.target.value || undefined })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 border-t pt-4">
            <ImageUpload
              label="Logo (PNG o JPG)"
              value={clinic.logoDataUrl}
              busy={busy}
              onFile={uploadImage('logoDataUrl', 'Logo actualizado')}
              onClear={() => setClinic({ logoDataUrl: undefined })}
            />

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
                onChange={(event) => setClinic({ showSignature: event.target.checked })}
              />
              Mostrar bloque de firmas en el documento
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
