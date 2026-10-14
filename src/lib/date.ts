const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * Formatea una fecha ISO corta (yyyy-mm-dd) como `13 de Octubre de 2026`.
 * Se construye a mano para evitar desfases por zona horaria.
 */
export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day || month < 1 || month > 12) return iso
  const name = MONTHS[month - 1]
  return `${day} de ${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`
}
