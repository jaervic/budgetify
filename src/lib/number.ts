/**
 * Interpreta un número escrito por una persona.
 *
 * Acepta las convenciones locales y las del ejemplo del proyecto:
 *   "876,80"   → 876.8     (coma decimal, es-VE)
 *   "1.234,56" → 1234.56   (miles con punto, decimal con coma)
 *   "1,234.56" → 1234.56   (miles con coma, decimal con punto)
 *   "876.80"   → 876.8     (punto decimal)
 *   "1.234.567" → 1234567  (varios puntos = separador de miles)
 *
 * Devuelve `NaN` si el texto no es un número válido.
 */
export function parseLocaleNumber(raw: string | number): number {
  if (typeof raw === 'number') return raw

  const value = raw.trim().replace(/\s/g, '')
  if (value === '') return NaN
  if (!/^[+-]?[\d.,]+$/.test(value)) return NaN

  const hasComma = value.includes(',')
  const hasDot = value.includes('.')
  let normalized = value

  if (hasComma && hasDot) {
    // El último separador es el decimal; el otro es de miles.
    normalized =
      value.lastIndexOf(',') > value.lastIndexOf('.')
        ? value.replace(/\./g, '').replace(',', '.')
        : value.replace(/,/g, '')
  } else if (hasComma) {
    // Solo coma: en es-VE es el separador decimal.
    normalized = value.replace(',', '.')
  } else if (hasDot && (value.match(/\./g) ?? []).length > 1) {
    // Varios puntos sin coma: separador de miles.
    normalized = value.replace(/\./g, '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}
