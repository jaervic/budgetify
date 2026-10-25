import { create } from 'zustand'
import { SYNC_ENABLED } from '@/lib/sync/config'
import type { SyncStatus, SyncUser } from '@/lib/sync/types'

interface SyncStoreState {
  /** La instalación tiene credenciales y no está desactivada por bandera. */
  enabled: boolean
  status: SyncStatus
  user: SyncUser | null
  lastSyncedAt: string | null
  error: string | null
  /** Operaciones locales pendientes de subir. */
  pending: number
  accountOpen: boolean
  mergeOpen: boolean
  mergeUserId: string | null
  mergeLocalCount: number
  mergeRemoteCount: number
  mergeBusy: boolean
  /** Se abrió un enlace de recuperación de contraseña. */
  recoveryOpen: boolean

  setEnabled: (enabled: boolean) => void
  setStatus: (status: SyncStatus) => void
  setUser: (user: SyncUser | null) => void
  setLastSyncedAt: (value: string | null) => void
  setError: (error: string | null) => void
  setPending: (pending: number) => void
  setAccountOpen: (open: boolean) => void
  openMerge: (userId: string, localCount: number, remoteCount: number) => void
  closeMerge: () => void
  setMergeBusy: (busy: boolean) => void
  setRecoveryOpen: (open: boolean) => void
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  enabled: SYNC_ENABLED,
  status: SYNC_ENABLED ? 'signed-out' : 'disabled',
  user: null,
  lastSyncedAt: null,
  error: null,
  pending: 0,
  accountOpen: false,
  mergeOpen: false,
  mergeUserId: null,
  mergeLocalCount: 0,
  mergeRemoteCount: 0,
  mergeBusy: false,
  recoveryOpen: false,

  setEnabled: (enabled) =>
    set((state) => ({
      enabled,
      status: enabled ? (state.status === 'disabled' ? 'signed-out' : state.status) : 'disabled',
    })),
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setError: (error) => set({ error }),
  setPending: (pending) => set({ pending }),
  setAccountOpen: (accountOpen) => set({ accountOpen }),
  openMerge: (mergeUserId, mergeLocalCount, mergeRemoteCount) =>
    set({ mergeOpen: true, mergeUserId, mergeLocalCount, mergeRemoteCount }),
  closeMerge: () =>
    set({
      mergeOpen: false,
      mergeUserId: null,
      mergeBusy: false,
    }),
  setMergeBusy: (mergeBusy) => set({ mergeBusy }),
  setRecoveryOpen: (recoveryOpen) => set({ recoveryOpen }),
}))
