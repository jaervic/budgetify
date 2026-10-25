import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSyncStore } from '@/store/useSyncStore'

function statusDot(status: string): string {
  switch (status) {
    case 'syncing':
      return 'bg-sky-500 animate-pulse'
    case 'error':
      return 'bg-destructive'
    case 'offline':
      return 'bg-amber-500'
    default:
      return 'bg-emerald-500'
  }
}

/** Acceso a la cuenta y estado discreto de la sincronización. */
export function AccountButton() {
  const enabled = useSyncStore((state) => state.enabled)
  const user = useSyncStore((state) => state.user)
  const status = useSyncStore((state) => state.status)
  const pending = useSyncStore((state) => state.pending)
  const setAccountOpen = useSyncStore((state) => state.setAccountOpen)

  if (!enabled) return null

  const label = user ? 'Cuenta' : 'Sincronizar'
  const statusDescription =
    status === 'syncing'
      ? 'sincronizando'
      : status === 'error'
        ? 'error de sincronización'
        : status === 'offline'
          ? 'sin conexión'
          : 'sincronizado'
  const description = user
    ? `Cuenta de ${user.email ?? 'usuario'}, ${statusDescription}${
        pending > 0 ? `, ${pending} cambios pendientes` : ''
      }`
    : 'Sincroniza en tu teléfono y computadora'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={description}
      onClick={() => setAccountOpen(true)}
    >
      <span className="relative inline-flex" aria-hidden="true">
        <UserRound />
        {user && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-background',
              statusDot(status),
            )}
          />
        )}
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        {label}
      </span>
      {pending > 0 && (
        <span className="sr-only">{pending} cambios pendientes de sincronizar</span>
      )}
    </Button>
  )
}
