/**
 * Interpreta un número escrito por una persona.
 *
 * Acepta las convenciones locales y las del ejemplo del proyecto:
 *   "876,80"   → 876.8     (coma decimal, es-VE)
 *   "1.234,56" → 1234.56   (miles con punto, decimal con coma)
 *   "1,234.56" → 1234.56   (miles con coma, decimal con punto)
 *   "876.80"   → 876.8     (punto decimal)
 *   "1.234"    → 1234      (es-VE: punto de miles con 3 dígitos detrás)
 *   "0.123"    → 0.123     (un cero delante siempre es decimal)
 *   "1.234.567" → 1234567  (varios puntos = separador de miles)
 *
 * El caso de un único punto seguido de exactamente tres dígitos es ambiguo
 * ("1.234" podría ser mil doscientos treinta y cuatro o uno coma doscientos
 * treinta y cuatro). En un presupuesto se escribe mucho más lo primero, y un
 * error ahí multiplica el precio por mil, así que se interpreta como miles.
 * Para los porcentajes y las cantidades pequeñas no cambia nada, y los montos
 * se redondean a dos decimales igualmente.
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
  } else if (hasDot) {
    const dots = (value.match(/\./g) ?? []).length
    const [intPart = '', decPart = ''] = value.split('.')
    const digits = /^[+-]/.test(intPart) ? intPart.slice(1) : intPart
    const looksLikeThousands =
      dots === 1 && decPart.length === 3 && /^[1-9]\d{0,2}$/.test(digits)
    // Varios puntos, o un punto de miles inequívoco, se quitan.
    normalized = dots > 1 || looksLikeThousands ? value.replace(/\./g, '') : value
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}
