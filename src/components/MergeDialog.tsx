import { useState } from 'react'
import { Cloud, GitMerge, ShieldAlert } from 'lucide-react'
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

/**
 * Este equipo ya tenía datos de otra cuenta. Nunca se suben solos a la cuenta
 * nueva: la persona elige combinarlos o descartarlos.
 */
export function MergeDialog() {
  const open = useSyncStore((state) => state.mergeOpen)
  const busy = useSyncStore((state) => state.mergeBusy)
  const localCount = useSyncStore((state) => state.mergeLocalCount)
  const remoteCount = useSyncStore((state) => state.mergeRemoteCount)
  const error = useSyncStore((state) => state.error)
  const [confirmCloud, setConfirmCloud] = useState(false)

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
            Este equipo ya tiene datos
          </DialogTitle>
          <DialogDescription>
            Ya hay datos guardados en este equipo. Elige qué hacer antes de sincronizar;
            nada se sube sin tu permiso. Si son de otra persona, usa «solo la nube».
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Este equipo: {localCount} documento(s)</p>
            <p className="text-muted-foreground">
              Se conservarán y se subirán a la cuenta que acabas de abrir.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">
              La nube:{' '}
              {remoteCount < 0
                ? 'no se pudo comprobar (sin conexión)'
                : `${remoteCount} documento(s)`}
            </p>
            <p className="text-muted-foreground">Se unirán con los de este equipo.</p>
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
            <GitMerge />
            Combinar ambos
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || remoteCount < 0}
            onClick={() => setConfirmCloud(true)}
          >
            <Cloud />
            Usar solo la nube
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void signOut(false)}
          >
            Ahora no
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          «Usar solo la nube» borra los datos locales de este navegador. No afecta a los
          datos que ya estén en la nube.
        </p>
      </DialogContent>

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
    </Dialog>
  )
}
