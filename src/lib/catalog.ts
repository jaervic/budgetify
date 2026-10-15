import type { CatalogService } from '@/types'

/**
 * Reglas del filtro por área de práctica.
 *
 * Un servicio sin área es transversal y aparece en todas las áreas: enfermería,
 * estudios de diagnóstico y gastos de clínica los necesita cualquier
 * especialista. Sin área seleccionada (`undefined`) no se filtra nada.
 */
export function isServiceInArea(
  service: CatalogService,
  specialtyId?: string,
): boolean {
  if (!specialtyId) return true
  return !service.specialtyId || service.specialtyId === specialtyId
}

export interface ServiceFilter {
  /** Texto a buscar en concepto, categoría y detalle. */
  query?: string
  /** Área de práctica; `undefined` no filtra. */
  specialtyId?: string
}

/** Texto de un servicio normalizado para buscar. */
function haystack(service: CatalogService): string {
  return `${service.concept} ${service.category} ${service.detail ?? ''}`.toLowerCase()
}

/** Aplica el filtro de área y el de texto sobre una lista de servicios. */
export function filterServices(
  services: CatalogService[],
  { query, specialtyId }: ServiceFilter = {},
): CatalogService[] {
  const term = query?.trim().toLowerCase() ?? ''
  return services.filter((service) => {
    if (!isServiceInArea(service, specialtyId)) return false
    return term ? haystack(service).includes(term) : true
  })
}
