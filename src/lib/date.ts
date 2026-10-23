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

/** Formatea una fecha ISO corta como `13/10/2026` (estilo de la cotización). */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day || month < 1 || month > 12) return iso
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

/**
 * Formatea un instante ISO completo (`toISOString`) como `13/10/2026, 14:05`.
 * Aquí sí interesa la zona horaria del usuario: es el momento en que guardó.
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
