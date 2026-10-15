import type { Specialty } from '@/types'

/**
 * Áreas de práctica (especialidades) incluidas de fábrica.
 *
 * El área sirve para dos cosas: filtrar el catálogo al buscar servicios y
 * encabezar el documento cuando el presupuesto es de un profesional
 * independiente. Un servicio sin área es transversal y se ofrece a todas.
 *
 * Es una lista fija: no se administran áreas desde la interfaz, solo se asigna
 * un área a cada servicio.
 */
export const DEFAULT_SPECIALTIES: Specialty[] = [
  { id: 'cirugia', name: 'Cirugía', titles: ['Dr.', 'Dra.'] },
  { id: 'medicina-general', name: 'Medicina General', titles: ['Dr.', 'Dra.'] },
  { id: 'odontologia', name: 'Odontología', titles: ['Od.', 'Odra.', 'Dr.', 'Dra.'] },
  {
    id: 'traumatologia',
    name: 'Traumatología y Ortopedia',
    titles: ['Dr.', 'Dra.'],
  },
  { id: 'pediatria', name: 'Pediatría', titles: ['Dr.', 'Dra.'] },
  {
    id: 'ginecologia',
    name: 'Ginecología y Obstetricia',
    titles: ['Dr.', 'Dra.'],
  },
  { id: 'dermatologia', name: 'Dermatología', titles: ['Dr.', 'Dra.'] },
]

/**
 * Títulos profesionales ofrecidos en el selector. Siempre se puede escribir
 * uno distinto a mano.
 */
export const DOCTOR_TITLES = [
  'Dr.',
  'Dra.',
  'Od.',
  'Odra.',
  'Lcdo.',
  'Lcda.',
  'Enf.',
  'Enf. Esp.',
  'Ps.',
  'Nut.',
  'T.S.U.',
  'Prof.',
]

/** Nombre del área a partir de su id (o `undefined` si no existe). */
export function specialtyName(
  specialtyId: string | undefined,
  specialties: Specialty[] = DEFAULT_SPECIALTIES,
): string | undefined {
  if (!specialtyId) return undefined
  return specialties.find((specialty) => specialty.id === specialtyId)?.name
}

/**
 * Nombre completo del profesional ("Dr. Juan Pérez") a partir del título y el
 * nombre, sin dejar espacios sobrantes cuando falta alguno de los dos.
 *
 * Si el nombre ya empieza por el título ("Dr. Juan Pérez") no se repite, que es
 * lo que pasa cuando alguien lo escribe entero en el campo del nombre.
 */
export function doctorFullName(
  title: string | undefined,
  name: string | undefined,
): string {
  const cleanTitle = title?.trim()
  const cleanName = name?.trim()
  if (!cleanName) return cleanTitle ?? ''
  if (!cleanTitle) return cleanName
  const normalize = (value: string) => value.toLowerCase().replace(/[.\s]/g, '')
  return normalize(cleanName).startsWith(normalize(cleanTitle))
    ? cleanName
    : `${cleanTitle} ${cleanName}`
}
