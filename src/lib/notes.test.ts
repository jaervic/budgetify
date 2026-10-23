import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTES } from '@/data/defaults'
import {
  changedNoteIndexes,
  missingNotes,
  noteKey,
  noteTitle,
  restoreMissingNotes,
  restoreNote,
} from './notes'

describe('notas predeterminadas', () => {
  it('reconoce una nota por su título aunque se edite el texto', () => {
    expect(noteKey('Formas de Pago: cuenta X')).toBe(noteKey(DEFAULT_NOTES[0]))
    expect(noteTitle(DEFAULT_NOTES[2])).toBe('Fondo de Imprevistos')
  })

  it('detecta las predeterminadas que se borraron', () => {
    const current = [DEFAULT_NOTES[0], DEFAULT_NOTES[2]]
    expect(missingNotes(current, DEFAULT_NOTES)).toEqual([DEFAULT_NOTES[1]])
  })

  it('vuelve a poner las que faltan sin duplicar las existentes', () => {
    const current = [DEFAULT_NOTES[0]]
    const restored = restoreMissingNotes(current, DEFAULT_NOTES)

    expect(restored).toHaveLength(DEFAULT_NOTES.length)
    expect(restoreMissingNotes(restored, DEFAULT_NOTES)).toEqual(restored)
  })

  it('marca las notas editadas y restaura solo la indicada', () => {
    const current = ['Formas de Pago: mis datos', DEFAULT_NOTES[1], 'Mi nota propia']
    expect(changedNoteIndexes(current, DEFAULT_NOTES)).toEqual(new Set([0]))

    const restored = restoreNote(current, 0, DEFAULT_NOTES)
    expect(restored[0]).toBe(DEFAULT_NOTES[0])
    expect(restored[2]).toBe('Mi nota propia')
  })

  it('no toca una nota propia que no tiene predeterminada', () => {
    const current = ['Mi nota propia']
    expect(restoreNote(current, 0, DEFAULT_NOTES)).toBe(current)
  })
})
