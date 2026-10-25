// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { clearMeta, createMeta, readMeta, syncMetaKey, updateMeta, writeMeta } from './meta'

describe('metadatos de sincronización', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('crea metadatos vacíos para un usuario nuevo', () => {
    const meta = readMeta('user-1')
    expect(meta.userId).toBe('user-1')
    expect(meta.lastPulledAt).toBeNull()
    expect(meta.dirty).toEqual({
      profile: false,
      draftBudget: false,
      draftQuote: false,
    })
    expect(meta.knownHistoryIds).toEqual([])
  })

  it('guarda y lee por usuario, sin mezclar cuentas', () => {
    const meta = createMeta('user-1')
    meta.dirty.profile = true
    meta.knownHistoryIds = ['a', 'b']
    meta.deletedHistory = { c: '2026-10-01T10:00:00.000Z' }
    writeMeta(meta)

    expect(readMeta('user-1').dirty.profile).toBe(true)
    expect(readMeta('user-1').knownHistoryIds).toEqual(['a', 'b'])
    expect(readMeta('user-1').deletedHistory).toEqual({
      c: '2026-10-01T10:00:00.000Z',
    })
    expect(readMeta('user-2').knownHistoryIds).toEqual([])
    expect(localStorage.getItem(syncMetaKey('user-1'))).not.toBeNull()
  })

  it('sanea un JSON corrupto o con tipos cambiados', () => {
    localStorage.setItem(
      syncMetaKey('user-1'),
      JSON.stringify({
        userId: 'user-1',
        lastPulledAt: 42,
        dirty: { profile: 'sí' },
        knownHistoryIds: ['a', 3, null],
        deletedHistory: { ok: '2026-10-01T10:00:00.000Z', bad: 4 },
        syncedDeletions: 'nope',
        historyRevs: { a: 2, b: 'x' },
      }),
    )
    const meta = readMeta('user-1')
    expect(meta.lastPulledAt).toBeNull()
    expect(meta.dirty.profile).toBe(false)
    expect(meta.knownHistoryIds).toEqual(['a'])
    expect(meta.deletedHistory).toEqual({ ok: '2026-10-01T10:00:00.000Z' })
    expect(meta.syncedDeletions).toEqual([])
    expect(meta.historyRevs).toEqual({ a: 2 })
  })

  it('actualiza y borra', () => {
    const meta = updateMeta('user-1', (current) => ({
      ...current,
      lastSyncedAt: '2026-10-01T10:00:00.000Z',
    }))
    expect(meta.lastSyncedAt).toBe('2026-10-01T10:00:00.000Z')
    expect(readMeta('user-1').lastSyncedAt).toBe('2026-10-01T10:00:00.000Z')

    clearMeta('user-1')
    expect(readMeta('user-1').lastSyncedAt).toBeNull()
  })

  it('ignora metadatos de otro usuario en la misma clave', () => {
    localStorage.setItem(
      syncMetaKey('user-1'),
      JSON.stringify({ ...createMeta('user-2'), userId: 'user-2' }),
    )
    expect(readMeta('user-1').userId).toBe('user-1')
    expect(readMeta('user-1').knownHistoryIds).toEqual([])
  })
})
