import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { PasswordInput } from '@/components/PasswordInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { changePassword } from '@/lib/sync/engine'
import { useSyncStore } from '@/store/useSyncStore'

/**
 * Se abre al volver de un enlace de recuperación de contraseña. El enlace ya
 * inicia la sesión; aquí solo se elige la contraseña nueva.
 */
export function PasswordRecoveryDialog() {
  const open = useSyncStore((state) => state.recoveryOpen)
  const setOpen = useSyncStore((state) => state.setRecoveryOpen)
  const user = useSyncStore((state) => state.user)
  const error = useSyncStore((state) => state.error)
  const setError = useSyncStore((state) => state.setError)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setPassword('')
    setConfirm('')
    setLocalError(null)
    setError(null)
    // Evita que al recargar se vuelva a procesar el enlace de recuperación.
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', window.location.pathname)
      } catch {
        // Navegadores embebidos que no permiten `replaceState`.
      }
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    setError(null)
    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      await changePassword(password)
      close()
    } catch {
      // El mensaje se muestra desde el store.
    } finally {
      setBusy(false)
    }
  }

  const feedback = localError ?? error

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else setOpen(true)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Nueva contraseña
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'El enlace ya inició tu sesión. Elige una contraseña nueva para entrar la próxima vez.'
              : 'Validando el enlace de recuperación…'}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Si no carga en unos segundos, el enlace puede haber caducado. Cierra esta
              ventana y solicita uno nuevo desde <strong>Cuenta → ¿Olvidaste tu
              contraseña?</strong>.
            </p>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="button" variant="outline" onClick={close}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1">
              <PasswordInput
                id="recovery-password"
                label="Contraseña nueva"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={8}
                disabled={busy}
              />
              <p className="text-sm text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>
            <PasswordInput
              id="recovery-confirm"
              label="Repite la contraseña"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              minLength={8}
              disabled={busy}
            />
            {feedback && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {feedback}
              </p>
            )}
            <Button type="submit" disabled={busy || password.length < 8 || confirm.length < 8}>
              {busy ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={close}>
              Ahora no
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
