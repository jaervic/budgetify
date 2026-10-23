/**
 * Notas predeterminadas: se identifican por su título (lo que va antes de los
 * dos puntos), así una nota editada sigue reconociéndose como la original.
 */

/** Título de una nota: lo que va antes de los dos puntos, o el texto completo. */
export function noteKey(text: string): string {
  const head = text.includes(':') ? text.slice(0, text.indexOf(':')) : text
  return head.trim().toLowerCase()
}

/** Notas predeterminadas que ya no están en la lista actual. */
export function missingNotes(current: string[], defaults: string[]): string[] {
  const keys = new Set(current.map(noteKey))
  return defaults.filter((note) => !keys.has(noteKey(note)))
}

/**
 * Vuelve a poner las predeterminadas que falten, sin tocar las demás. Cada
 * nota recuperada se coloca después de la predeterminada que la precedía, así
 * el orden de fábrica se conserva.
 */
export function restoreMissingNotes(current: string[], defaults: string[]): string[] {
  const result = [...current]
  defaults.forEach((note, index) => {
    const key = noteKey(note)
    if (result.some((entry) => noteKey(entry) === key)) return
    let at = 0
    for (let previous = index - 1; previous >= 0; previous--) {
      const found = result.findIndex((entry) => noteKey(entry) === noteKey(defaults[previous]))
      if (found !== -1) {
        at = found + 1
        break
      }
    }
    result.splice(at, 0, note)
  })
  return result
}

/** Índices de las notas cuyo texto cambió respecto a su predeterminada. */
export function changedNoteIndexes(current: string[], defaults: string[]): Set<number> {
  const changed = new Set<number>()
  current.forEach((note, index) => {
    const original = defaults.find((entry) => noteKey(entry) === noteKey(note))
    if (original !== undefined && original !== note) changed.add(index)
  })
  return changed
}

/** Devuelve la nota con el texto original de su predeterminada. */
export function restoreNote(current: string[], index: number, defaults: string[]): string[] {
  const original = defaults.find((entry) => noteKey(entry) === noteKey(current[index] ?? ''))
  if (original === undefined) return current
  return current.map((note, i) => (i === index ? original : note))
}

/** Título corto de una nota para mostrarlo en avisos (p. ej. «Fondo de imprevistos»). */
export function noteTitle(text: string): string {
  return text.includes(':') ? text.slice(0, text.indexOf(':')).trim() : text.trim().slice(0, 40)
}
