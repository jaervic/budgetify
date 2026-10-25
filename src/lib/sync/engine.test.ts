// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloneDefaultCatalog } from '@/data/catalog'
import {
  cloneDefaultClinic,
  createEmptyBudget,
  createEmptyQuote,
  DEFAULT_QUOTE_TERMS,
} from '@/data/defaults'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useSyncStore } from '@/store/useSyncStore'
import type { SavedDocument } from '@/types'

const fake = vi.hoisted(() => {
  const state = {
    session: { user: { id: 'user-1', email: 'ana@example.com' } } as {
      user: { id: string; email: string }
    } | null,
    remote: {
      profile: null as null | {
        user_id: string
        payload: string
        enc: boolean
        iv: null
        alg: null
        rev: number
        updated_at: string
      },
      documents: [] as Array<{
        user_id: string
        id: string
        kind: 'budget' | 'quote'
        payload: string
        enc: boolean
        iv: null
        alg: null
        saved_at: string
        updated_at: string
        deleted_at: string | null
        rev: number
      }>,
      drafts: [] as Array<{
        user_id: string
        mode: 'budget' | 'quote'
        payload: string
        enc: boolean
        iv: null
        alg: null
        rev: number
        updated_at: string
      }>,
    },
    profileWrites: 0,
    draftWrites: 0,
    documentWrites: 0,
    deletedIds: [] as string[],
  }
  return state
})

vi.mock('./config', () => ({
  SYNC_ENABLED: true,
  SYNC_CONFIGURED: true,
  SYNC_DISABLED_BY_FLAG: false,
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
}))

vi.mock('./client', () => ({
  getSession: vi.fn(async () => fake.session),
  onAuthChange: vi.fn(async () => () => {}),
  signInWithEmail: vi.fn(async () => {}),
  signInWithPassword: vi.fn(async () => {}),
  signUpWithPassword: vi.fn(async () => ({ needsConfirmation: false })),
  requestPasswordReset: vi.fn(async () => {}),
  updatePassword: vi.fn(async () => {}),
  signOutRemote: vi.fn(async () => {}),
  deleteRemoteAccount: vi.fn(async () => {}),
  fetchRemoteCounts: vi.fn(async () => ({
    hasProfile: Boolean(fake.remote.profile),
    documents: fake.remote.documents.filter((row) => !row.deleted_at).length,
  })),
  pullRemote: vi.fn(async () => ({
    profile: fake.remote.profile,
    documents: fake.remote.documents,
    drafts: fake.remote.drafts,
  })),
  upsertProfile: vi.fn(async (_userId: string, payload: string) => {
    fake.profileWrites += 1
    const rev = (fake.remote.profile?.rev ?? 0) + 1
    const updated_at = new Date().toISOString()
    fake.remote.profile = {
      user_id: 'user-1',
      payload,
      enc: false,
      iv: null,
      alg: null,
      rev,
      updated_at,
    }
    return { rev, updated_at }
  }),
  upsertDraft: vi.fn(
    async (_userId: string, mode: 'budget' | 'quote', payload: { version: 1 }) => {
      fake.draftWrites += 1
      const current = fake.remote.drafts.find((row) => row.mode === mode)
      const rev = (current?.rev ?? 0) + 1
      const updated_at = new Date().toISOString()
      const next = {
        user_id: 'user-1',
        mode,
        payload: JSON.stringify(payload),
        enc: false,
        iv: null,
        alg: null,
        rev,
        updated_at,
      }
      fake.remote.drafts = [
        ...fake.remote.drafts.filter((row) => row.mode !== mode),
        next,
      ]
      return { rev, updated_at }
    },
  ),
  upsertDocument: vi.fn(async (_userId: string, document: SavedDocument) => {
    fake.documentWrites += 1
    const current = fake.remote.documents.find((row) => row.id === document.id)
    const rev = (current?.rev ?? 0) + 1
    const updated_at = new Date().toISOString()
    const next = {
      user_id: 'user-1',
      id: document.id,
      kind: document.kind,
      payload: JSON.stringify(document),
      enc: false,
      iv: null,
      alg: null,
      saved_at: document.savedAt,
      updated_at,
      deleted_at: null,
      rev,
    }
    fake.remote.documents = [
      ...fake.remote.documents.filter((row) => row.id !== document.id),
      next,
    ]
    return { rev, updated_at }
  }),
  deleteDocumentRemote: vi.fn(async (_userId: string, id: string) => {
    fake.deletedIds.push(id)
    const current = fake.remote.documents.find((row) => row.id === id)
    if (!current) return null
    const updated_at = new Date().toISOString()
    fake.remote.documents = fake.remote.documents.map((row) =>
      row.id === id ? { ...row, deleted_at: updated_at, rev: row.rev + 1, updated_at } : row,
    )
    return { rev: current.rev + 1, updated_at }
  }),
  isOnline: () => true,
  errorMessage: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}))

const { initSync, resolveMerge, syncNow } = await import('./engine')
const { readOwner } = await import('./owner')

function storedBudget(id: string, savedAt: string, name: string): SavedDocument {
  return {
    id,
    savedAt,
    kind: 'budget',
    budget: { ...createEmptyBudget(), patient: { name } },
  }
}

async function waitUntilIdle() {
  await vi.waitFor(
    () => {
      const status = useSyncStore.getState().status
      expect(['idle', 'signed-out', 'offline']).toContain(status)
      expect(useSyncStore.getState().user?.id).toBe('user-1')
    },
    { timeout: 5_000, interval: 20 },
  )
}

describe('motor de sincronización (servidor en memoria)', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('sb-test-auth-token', '1')
    fake.remote = { profile: null, documents: [], drafts: [] }
    fake.profileWrites = 0
    fake.draftWrites = 0
    fake.documentWrites = 0
    fake.deletedIds = []

    useBudgetStore.getState().resetLocalData()
  })

  it('sube los datos locales, descarga los remotos y resuelve conflictos', async () => {
    const local = storedBudget('saved_local', '2026-10-01T10:00:00.000Z', 'Ana local')
    useBudgetStore.setState({
      clinic: { ...cloneDefaultClinic(), name: 'Clínica local' },
      catalog: cloneDefaultCatalog(),
      pageSize: 'A4',
      quotePageSize: 'Letter',
      rateMode: 'auto',
      savedBudgetNotes: null,
      savedQuoteTerms: null,
      quoteCounter: 1,
      budget: {
        ...createEmptyBudget(),
        patient: { name: 'Paciente local' },
        notes: [...createEmptyBudget().notes],
      },
      quote: { ...createEmptyQuote(), terms: DEFAULT_QUOTE_TERMS },
      history: [local],
    })

    initSync()
    // Al haber datos locales, primero hay que decidir qué hacer con ellos.
    await vi.waitFor(
      () => expect(useSyncStore.getState().mergeOpen).toBe(true),
      { timeout: 5_000, interval: 20 },
    )
    await resolveMerge('merge')
    await vi.waitFor(
      () => expect(useSyncStore.getState().mergeOpen).toBe(false),
      { timeout: 5_000, interval: 20 },
    )
    await waitUntilIdle()

    expect(readOwner().userId).toBe('user-1')
    expect(fake.profileWrites).toBe(1)
    expect(fake.documentWrites).toBe(1)
    expect(fake.remote.documents.map((row) => row.id)).toContain('saved_local')
    expect(fake.draftWrites).toBe(1) // solo el presupuesto tiene datos

    // Llega un documento de otro equipo.
    const remote = storedBudget('saved_remote', '2026-10-03T10:00:00.000Z', 'Luis remoto')
    fake.remote.documents.push({
      user_id: 'user-1',
      id: remote.id,
      kind: remote.kind,
      payload: JSON.stringify(remote),
      enc: false,
      iv: null,
      alg: null,
      saved_at: remote.savedAt,
      updated_at: new Date(Date.now() + 1_000).toISOString(),
      deleted_at: null,
      rev: 1,
    })
    await syncNow('manual')
    await waitUntilIdle()
    expect(useBudgetStore.getState().history.map((entry) => entry.id)).toContain(
      'saved_remote',
    )

    // Edición local del borrador + edición remota del mismo borrador, sin
    // sincronizar entre ambas: debe aparecer una copia de conflicto.
    useBudgetStore.getState().setPatient({ name: 'Paciente local después' })

    const remoteBudget = {
      version: 1 as const,
      budget: {
        ...createEmptyBudget(),
        patient: { name: 'Paciente editado en el teléfono' },
      },
    }
    fake.remote.drafts = [
      ...fake.remote.drafts.filter((row) => row.mode !== 'budget'),
      {
        user_id: 'user-1',
        mode: 'budget',
        payload: JSON.stringify(remoteBudget),
        enc: false,
        iv: null,
        alg: null,
        rev: 99,
        updated_at: new Date(Date.now() + 2_000).toISOString(),
      },
    ]
    await syncNow('manual')
    await waitUntilIdle()

    // El borrador local se conserva y la versión remota queda en el historial.
    expect(useBudgetStore.getState().budget.patient.name).toBe(
      'Paciente local después',
    )
    const conflict = useBudgetStore
      .getState()
      .history.find(
        (entry) =>
          entry.kind === 'budget' &&
          entry.budget.notes.some((note) => note.includes('Copia en conflicto')),
      )
    expect(conflict).toBeTruthy()

    // Borrado local: se comunica al servidor.
    const remoteDocument = useBudgetStore
      .getState()
      .history.find((entry) => entry.id === 'saved_remote')
    expect(remoteDocument).toBeTruthy()
    useBudgetStore.getState().removeSavedBudget('saved_remote')
    await syncNow('manual')
    await waitUntilIdle()
    expect(fake.deletedIds).toContain('saved_remote')
    expect(
      fake.remote.documents.find((row) => row.id === 'saved_remote')?.deleted_at,
    ).toBeTruthy()

    // Deshacer el borrado: se quita la lápida y se resucita en la nube.
    useBudgetStore.setState((state) => ({
      history: [remoteDocument!, ...state.history],
    }))
    await syncNow('manual')
    await waitUntilIdle()
    expect(useBudgetStore.getState().history.map((entry) => entry.id)).toContain(
      'saved_remote',
    )
    expect(
      fake.remote.documents.find((row) => row.id === 'saved_remote')?.deleted_at,
    ).toBeNull()
  })
})
