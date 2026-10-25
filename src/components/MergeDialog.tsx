import { useState } from 'react'
import { Cloud, GitMerge, ShieldAlert, Upload } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveMerge, signOut } from '@/lib/sync/engine'
import { useSyncStore } from '@/store/useSyncStore'

function documentCount(count: number): string {
  return `${count} ${count === 1 ? 'documento' : 'documentos'}`
}

/**
 * Este equipo ya tenía datos. Nunca se suben solos a la cuenta: la persona
 * elige conservarlos o descartarlos. Si la nube está vacía, descartarlos no
 * tiene sentido, así que solo se ofrece subirlos.
 */
export function MergeDialog() {
  const open = useSyncStore((state) => state.mergeOpen)
  const busy = useSyncStore((state) => state.mergeBusy)
  const localCount = useSyncStore((state) => state.mergeLocalCount)
  const remoteCount = useSyncStore((state) => state.mergeRemoteCount)
  const error = useSyncStore((state) => state.error)
  const [confirmCloud, setConfirmCloud] = useState(false)

  const cloudEmpty = remoteCount === 0
  const cloudUnknown = remoteCount < 0

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-600" />
            {cloudEmpty
              ? 'Tus documentos están en este equipo'
              : 'Este equipo ya tiene datos'}
          </DialogTitle>
          <DialogDescription>
            {cloudEmpty
              ? `Hay ${documentCount(localCount)} en este equipo y la nube está vacía. Para conservarlos, súbelos a tu cuenta.`
              : 'Ya hay datos guardados en este equipo. Elige qué hacer antes de sincronizar; nada se sube sin tu permiso.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Este equipo: {documentCount(localCount)}</p>
            <p className="text-muted-foreground">
              {cloudEmpty
                ? 'Se conservarán y se subirán a la cuenta que acabas de abrir.'
                : 'Se conservarán y se unirán con lo que ya esté en la nube.'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">
              La nube:{' '}
              {cloudUnknown
                ? 'no se pudo comprobar (sin conexión)'
                : cloudEmpty
                  ? 'vacía'
                  : documentCount(remoteCount)}
            </p>
            <p className="text-muted-foreground">
              {cloudUnknown
                ? 'Puedes conservar los documentos de este equipo y sincronizar cuando vuelva la conexión.'
                : cloudEmpty
                  ? 'No hay nada que descargar. Subir es la opción segura.'
                  : 'Se unirán con los de este equipo.'}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Al combinar, la empresa y el catálogo se mezclan campo a campo; lo que exista
          solo en la nube se conserva.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="grid gap-2">
          <Button type="button" disabled={busy} onClick={() => void resolveMerge('merge')}>
            {cloudEmpty ? <Upload /> : <GitMerge />}
            {cloudEmpty ? 'Subir mis documentos' : 'Combinar ambos'}
          </Button>
          {!cloudEmpty && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || cloudUnknown}
              onClick={() => setConfirmCloud(true)}
            >
              <Cloud />
              Usar solo la nube
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void signOut(false)}
          >
            Ahora no, conservar aquí
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {cloudEmpty
            ? 'Tus documentos siguen en este equipo. «Ahora no» cierra la sesión sin borrarlos.'
            : '«Usar solo la nube» borra los datos locales de este navegador. No afecta a los datos que ya estén en la nube.'}
        </p>
      </DialogContent>

      {!cloudEmpty && (
        <ConfirmDialog
          open={confirmCloud}
          onOpenChange={setConfirmCloud}
          title="Borrar los datos de este equipo"
          description="Se borrarán el borrador, el historial y la empresa guardados en este navegador. Los datos de la nube no se tocan."
          confirmLabel="Borrar y usar la nube"
          destructive
          onConfirm={() => {
            setConfirmCloud(false)
            void resolveMerge('cloud')
          }}
        />
      )}
    </Dialog>
  )
}
