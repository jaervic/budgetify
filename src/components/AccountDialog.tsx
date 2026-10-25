import { useState, type FormEvent } from 'react'
import {
  CloudOff,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PasswordInput } from '@/components/PasswordInput'
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
import { formatTimestamp } from '@/lib/date'
import {
  changePassword,
  deleteAccount,
  requestPasswordReset,
  signIn,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  syncNow,
} from '@/lib/sync/engine'
import { useSyncStore } from '@/store/useSyncStore'

function statusText(status: string, pending: number): string {
  switch (status) {
    case 'syncing':
      return 'Sincronizando…'
    case 'offline':
      return 'Sin conexión. Los cambios se enviarán al volver la red.'
    case 'error':
      return 'No se pudo sincronizar.'
    default:
      return pending > 0 ? `${pending} cambios pendientes` : 'Todo al día'
  }
}

type AuthMode = 'signin' | 'signup' | 'reset'
type SentView = 'magic' | 'reset' | null

/** Diálogo de cuenta: acceso, estado de sync, contraseña, cierre y borrado. */
export function AccountDialog() {
  const open = useSyncStore((state) => state.accountOpen)
  const setOpen = useSyncStore((state) => state.setAccountOpen)
  const enabled = useSyncStore((state) => state.enabled)
  const user = useSyncStore((state) => state.user)
  const status = useSyncStore((state) => state.status)
  const error = useSyncStore((state) => state.error)
  const pending = useSyncStore((state) => state.pending)
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt)
  const setStoreError = useSyncStore((state) => state.setError)

  const [mode, setMode] = useState<AuthMode>('signin')
  const [sent, setSent] = useState<SentView>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clearLocal, setClearLocal] = useState(false)

  const resetAuthState = () => {
    setMode('signin')
    setSent(null)
    setPassword('')
    setConfirm('')
    setLocalError(null)
    setInfo(null)
    setChangingPassword(false)
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetAuthState()
  }

  const resetFeedback = () => {
    setLocalError(null)
    setInfo(null)
    setStoreError(null)
  }

  const switchMode = (next: AuthMode) => {
    resetFeedback()
    setSent(null)
    setPassword('')
    setConfirm('')
    setMode(next)
  }

  const handlePasswordAuth = async (event: FormEvent) => {
    event.preventDefault()
    resetFeedback()
    const value = email.trim()

    if (mode === 'reset') {
      if (!value) {
        setLocalError('Escribe tu correo.')
        return
      }
      setBusy(true)
      try {
        await requestPasswordReset(value)
        setSent('reset')
      } catch {
        // El mensaje se muestra desde el store.
      } finally {
        setBusy(false)
      }
      return
    }

    if (!value) {
      setLocalError('Escribe tu correo.')
      return
    }
    if (mode === 'signup' && password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (mode === 'signup' && password !== confirm) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithPassword(value, password)
      } else {
        const result = await signUpWithPassword(value, password)
        if (result.needsConfirmation) {
          setInfo(
            'Cuenta creada. Revisa tu correo para confirmarla y después entra con tu contraseña.',
          )
          setMode('signin')
          setPassword('')
          setConfirm('')
        }
      }
    } catch {
      // El mensaje se muestra desde el store.
    } finally {
      setBusy(false)
    }
  }

  const handleMagicLink = async () => {
    resetFeedback()
    const value = email.trim()
    if (!value) {
      setLocalError('Escribe tu correo.')
      return
    }
    setBusy(true)
    try {
      await signIn(value)
      setMode('signin')
      setSent('magic')
    } catch {
      // El mensaje se muestra desde el store.
    } finally {
      setBusy(false)
    }
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    resetFeedback()
    if (newPassword.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      await changePassword(newPassword)
      setChangingPassword(false)
      setNewPassword('')
      setConfirmNewPassword('')
    } catch {
      // El mensaje se muestra desde el store.
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = () => {
    setConfirmLogout(false)
    const shouldClear = clearLocal
    setClearLocal(false)
    setEmail('')
    setSent(null)
    setPassword('')
    setConfirm('')
    setMode('signin')
    setChangingPassword(false)
    void signOut(shouldClear).catch((cause: unknown) => {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo cerrar la sesión.')
    })
  }

  const handleDelete = () => {
    setConfirmDelete(false)
    setEmail('')
    setSent(null)
    setPassword('')
    setConfirm('')
    setMode('signin')
    setChangingPassword(false)
    void deleteAccount().catch((cause: unknown) => {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo borrar la cuenta.')
    })
  }

  const feedback = localError ?? error

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tu cuenta</DialogTitle>
            <DialogDescription>
              Sincroniza el historial y la empresa entre tu teléfono y tu computadora.
            </DialogDescription>
          </DialogHeader>

          {!enabled ? (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
              La sincronización no está configurada en esta instalación. Todo se sigue
              guardando solo en este navegador.
            </p>
          ) : user ? (
            <div className="grid gap-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">{user.email ?? 'Cuenta sin correo'}</p>
                <p className="text-sm text-muted-foreground">
                  {statusText(status, pending)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lastSyncedAt
                    ? `Última sincronización: ${formatTimestamp(lastSyncedAt)}`
                    : 'Todavía no se ha sincronizado.'}
                </p>
              </div>

              {feedback && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {feedback}
                </p>
              )}

              <div className="grid gap-2">
                <Button
                  type="button"
                  disabled={status === 'syncing' || status === 'offline'}
                  onClick={() => void syncNow('manual')}
                >
                  <RefreshCw className={status === 'syncing' ? 'animate-spin' : undefined} />
                  Sincronizar ahora
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={status === 'syncing'}
                  onClick={() => {
                    resetFeedback()
                    setChangingPassword(true)
                  }}
                >
                  <KeyRound />
                  Cambiar contraseña
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={status === 'syncing'}
                  onClick={() => setConfirmLogout(true)}
                >
                  <LogOut />
                  Cerrar sesión
                </Button>
              </div>

              {changingPassword && (
                <form
                  className="grid gap-3 rounded-lg border p-3"
                  onSubmit={handleChangePassword}
                >
                  <p className="text-sm text-muted-foreground">
                    Si entraste con un enlace por correo, aquí puedes crear una contraseña
                    para entrar directamente la próxima vez.
                  </p>
                  <PasswordInput
                    id="new-password"
                    label="Nueva contraseña"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={busy}
                  />
                  <PasswordInput
                    id="confirm-new-password"
                    label="Repite la contraseña"
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={busy}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={busy}>
                      {busy ? 'Guardando…' : 'Guardar contraseña'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        setChangingPassword(false)
                        setNewPassword('')
                        setConfirmNewPassword('')
                        resetFeedback()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  Los datos viajan cifrados y se guardan en Supabase para tu cuenta. La
                  app no tiene analítica ni rastreadores. Sin cuenta, nada sale de este
                  navegador.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={status === 'syncing'}
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                Borrar mi cuenta y mis datos
              </Button>
            </div>
          ) : sent === 'magic' ? (
            <div className="grid gap-3">
              <p>
                Te enviamos un enlace a <strong>{email.trim()}</strong>. Ábrelo en este
                mismo dispositivo para entrar.
              </p>
              <p className="text-sm text-muted-foreground">
                Si no llega en unos minutos, revisa la carpeta de spam o vuelve a
                intentarlo.
              </p>
              <Button type="button" variant="outline" onClick={() => switchMode('signin')}>
                Volver
              </Button>
            </div>
          ) : sent === 'reset' ? (
            <div className="grid gap-3">
              <p>
                Te enviamos un enlace a <strong>{email.trim()}</strong> para crear una
                contraseña nueva. Ábrelo en este dispositivo.
              </p>
              <p className="text-sm text-muted-foreground">
                Si no llega, revisa spam o vuelve a solicitar el enlace.
              </p>
              <Button type="button" variant="outline" onClick={() => switchMode('signin')}>
                Volver a entrar
              </Button>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handlePasswordAuth}>
              <p className="text-sm text-muted-foreground">
                {mode === 'signin'
                  ? 'Entra con tu correo y contraseña, o pide un enlace por correo.'
                  : mode === 'signup'
                    ? 'Crea una cuenta con tu correo y una contraseña.'
                    : 'Escribe tu correo y te enviamos un enlace para cambiar la contraseña.'}
              </p>

              <div className="grid gap-2">
                <Label htmlFor="sync-email">Correo electrónico</Label>
                <Input
                  id="sync-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>

              {mode !== 'reset' && (
                <PasswordInput
                  id="sync-password"
                  label="Contraseña"
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  disabled={busy}
                />
              )}

              {mode === 'signup' && (
                <PasswordInput
                  id="sync-confirm"
                  label="Repite la contraseña"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  minLength={8}
                  disabled={busy}
                />
              )}

              {feedback && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {feedback}
                </p>
              )}

              {info && (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  {info}
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  busy ||
                  !email.trim() ||
                  (mode === 'signup' && (password.length < 8 || confirm.length < 8))
                }
              >
                {busy
                  ? 'Procesando…'
                  : mode === 'signin'
                    ? 'Entrar'
                    : mode === 'signup'
                      ? 'Crear cuenta'
                      : 'Enviar enlace de recuperación'}
              </Button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {mode === 'signin' ? (
                  <>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => switchMode('signup')}
                    >
                      Crear una cuenta
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => switchMode('reset')}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => switchMode('signin')}
                  >
                    {mode === 'signup' ? 'Ya tengo cuenta' : 'Volver a entrar'}
                  </Button>
                )}
              </div>

              {mode !== 'reset' && (
                <>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    o
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !email.trim()}
                    onClick={() => void handleMagicLink()}
                  >
                    <Mail />
                    Enviar enlace de acceso por correo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    El enlace mágico usa el correo configurado en Supabase. No necesitas
                    contraseña.
                  </p>
                </>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  Al usar una cuenta aceptas que guardemos tu correo y los documentos
                  que archives para sincronizarlos. Tu contraseña la guarda Supabase
                  como hash; la app nunca la almacena. Puedes borrar la cuenta y sus datos
                  desde este mismo diálogo. La app sigue funcionando sin conexión y sin
                  cuenta.
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CloudOff className="size-3.5" />
                No uses datos reales de pacientes en una demo pública.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={(next) => {
          setConfirmLogout(next)
          if (!next) setClearLocal(false)
        }}
        title="¿Cerrar sesión?"
        description={
          <div className="grid gap-2">
            <p>Tu cuenta y sus datos seguirán en la nube.</p>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={clearLocal}
                onChange={(event) => setClearLocal(event.target.checked)}
              />
              <span>
                Borrar también los datos guardados en este equipo. Úsalo si es una
                computadora compartida.
              </span>
            </label>
          </div>
        }
        confirmLabel="Cerrar sesión"
        onConfirm={handleSignOut}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Borrar cuenta y datos"
        description={
          <div className="grid gap-2">
            <p>
              Se borrarán tu cuenta, el historial y la empresa de la nube. Esta acción no
              se puede deshacer.
            </p>
            <p>Los datos de este equipo también se borrarán.</p>
          </div>
        }
        confirmLabel="Borrar todo"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
