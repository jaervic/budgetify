import { describe, expect, it } from 'vitest'
import type { CatalogService } from '@/types'
import { filterServices, isServiceInArea } from './catalog'

const service = (
  id: string,
  concept: string,
  category: string,
  specialtyId?: string,
  detail?: string,
): CatalogService => ({
  id,
  category,
  concept,
  detail,
  formula: { type: 'fixed', amountUsd: 10 },
  specialtyId,
})

const SERVICES: CatalogService[] = [
  service('a', 'Endodoncia unirradicular', 'Odontología · Endodoncia', 'odontologia', '1 conducto'),
  service('b', 'Consulta traumatológica', 'Traumatología y Ortopedia', 'traumatologia'),
  service('c', 'Aplicación de vacuna', 'Enfermería'),
  service('d', 'Rayos X', 'Estudios y Diagnóstico'),
]

describe('isServiceInArea', () => {
  it('sin área seleccionada no filtra nada', () => {
    for (const item of SERVICES) {
      expect(isServiceInArea(item, undefined)).toBe(true)
    }
  })

  it('un servicio sin área es transversal y aparece en todas las áreas', () => {
    const vacuna = SERVICES.find((s) => s.id === 'c')!
    expect(isServiceInArea(vacuna, 'odontologia')).toBe(true)
    expect(isServiceInArea(vacuna, 'traumatologia')).toBe(true)
  })

  it('solo muestra los servicios del área elegida', () => {
    expect(isServiceInArea(SERVICES[0], 'odontologia')).toBe(true)
    expect(isServiceInArea(SERVICES[0], 'traumatologia')).toBe(false)
    expect(isServiceInArea(SERVICES[1], 'traumatologia')).toBe(true)
    expect(isServiceInArea(SERVICES[1], 'odontologia')).toBe(false)
  })
})

describe('filterServices', () => {
  it('muestra el área elegida más los transversales', () => {
    expect(
      filterServices(SERVICES, { specialtyId: 'odontologia' }).map((s) => s.id),
    ).toEqual(['a', 'c', 'd'])
    expect(
      filterServices(SERVICES, { specialtyId: 'traumatologia' }).map((s) => s.id),
    ).toEqual(['b', 'c', 'd'])
  })

  it('sin área devuelve todo', () => {
    expect(filterServices(SERVICES)).toHaveLength(SERVICES.length)
  })

  it('busca en concepto, categoría y detalle', () => {
    expect(filterServices(SERVICES, { query: 'endo' }).map((s) => s.id)).toEqual(['a'])
    expect(filterServices(SERVICES, { query: 'ENFERMERÍA' }).map((s) => s.id)).toEqual([
      'c',
    ])
    expect(filterServices(SERVICES, { query: '1 conducto' }).map((s) => s.id)).toEqual([
      'a',
    ])
    expect(filterServices(SERVICES, { query: 'estudios' }).map((s) => s.id)).toEqual(['d'])
  })

  it('combina área y texto', () => {
    expect(
      filterServices(SERVICES, { specialtyId: 'odontologia', query: 'vacuna' }).map(
        (s) => s.id,
      ),
    ).toEqual(['c'])
    expect(
      filterServices(SERVICES, { specialtyId: 'odontologia', query: 'traumato' }),
    ).toEqual([])
  })

  it('ignora espacios sobrantes en la búsqueda', () => {
    expect(filterServices(SERVICES, { query: '   ' })).toHaveLength(SERVICES.length)
  })
})
