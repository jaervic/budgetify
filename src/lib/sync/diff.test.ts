import { describe, expect, it } from 'vitest'
import { createEmptyBudget } from '@/data/defaults'
import type { SavedDocument } from '@/types'
import { historyDiff, pendingCount } from './diff'
import { createMeta } from './meta'

function document(id: string): SavedDocument {
  return {
    id,
    savedAt: '2026-10-01T10:00:00.000Z',
    kind: 'budget',
    budget: createEmptyBudget(),
  }
}

describe('diferencia del historial', () => {
  it('sube lo desconocido y borra lo que tiene lápida sin confirmar', () => {
    const meta = createMeta('user-1')
    meta.knownHistoryIds = ['a']
    meta.deletedHistory = {
      b: '2026-10-01T10:00:00.000Z',
      c: '2026-10-02T10:00:00.000Z',
    }
    meta.syncedDeletions = ['c']

    const diff = historyDiff([document('a'), document('b'), document('d')], meta)
    expect(diff.toPush.map((entry) => entry.id)).toEqual(['d'])
    expect(diff.toDelete).toEqual(['b'])
  })

  it('no borra un id conocido que desapareció sin lápida (posible pérdida local)', () => {
    const meta = createMeta('user-1')
    meta.knownHistoryIds = ['a', 'b']
    const diff = historyDiff([document('b')], meta)
    expect(diff.toDelete).toEqual([])
    expect(diff.toPush).toEqual([])
  })

  it('cuenta perfil, borradores y documentos pendientes', () => {
    const meta = createMeta('user-1')
    meta.dirty.profile = true
    meta.dirty.draftQuote = true
    meta.deletedHistory = { a: '2026-10-01T10:00:00.000Z' }
    expect(pendingCount([document('b')], meta)).toBe(4)
  })
})
