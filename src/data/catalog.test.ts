import { describe, expect, it } from 'vitest'
import { computeBudget } from '@/lib/calc'
import { formatUsd } from '@/lib/money'
import type { Catalog, Item } from '@/types'
import {
  cloneDefaultCatalog,
  DEFAULT_CATALOG,
  DEFAULT_SERVICES,
  mergeDefaultProducts,
  migrateCatalogDefaults,
} from './catalog'
import { DEFAULT_PRODUCTS, PRODUCT_CATEGORIES } from './products'

function itemsFromPack(packId: string): Item[] {
  const pack = DEFAULT_CATALOG.packs.find((entry) => entry.id === packId)
  if (!pack) throw new Error(`Pack no encontrado: ${packId}`)
  return pack.services.map((entry, index) => {
    const service = DEFAULT_SERVICES.find((s) => s.id === entry.serviceId)
    if (!service) throw new Error(`Servicio no encontrado: ${entry.serviceId}`)
    return {
      id: `i${index}`,
      category: service.category,
      concept: service.concept,
      detail: service.detail,
      formula: structuredClone(service.formula),
    }
  })
}

describe('catálogo por defecto', () => {
  it('no tiene ids de servicio duplicados', () => {
    const ids = DEFAULT_CATALOG.services.map((service) => service.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no repite categorías', () => {
    const { categories } = DEFAULT_CATALOG
    expect(new Set(categories).size).toBe(categories.length)
  })

  it('cada servicio pertenece a una categoría declarada', () => {
    for (const service of DEFAULT_CATALOG.services) {
      expect(DEFAULT_CATALOG.categories).toContain(service.category)
    }
  })

  it('los packs sólo apuntan a servicios existentes', () => {
    const ids = new Set(DEFAULT_SERVICES.map((service) => service.id))
    for (const pack of DEFAULT_CATALOG.packs) {
      for (const entry of pack.services) {
        expect(ids.has(entry.serviceId)).toBe(true)
      }
    }
  })

  it('el pack de cirugía mantiene el total del presupuesto real', () => {
    expect(formatUsd(computeBudget(itemsFromPack('pack_cirugia_base')).totalUsd)).toBe(
      '$1,375.00',
    )
  })

  it('el pack de chequeo general cuadra con sus servicios', () => {
    // 40 (consulta) + 12 (ECG) + 5 (hematología) + 12 (perfil 20) = 69
    expect(formatUsd(computeBudget(itemsFromPack('pack_chequeo_general')).totalUsd)).toBe(
      '$69.00',
    )
  })

  it('cada servicio pertenece a un área declarada', () => {
    const ids = new Set(DEFAULT_CATALOG.specialties.map((s) => s.id))
    for (const service of DEFAULT_CATALOG.services) {
      if (service.specialtyId) expect(ids.has(service.specialtyId)).toBe(true)
    }
  })

  it('no repite áreas de práctica', () => {
    const ids = DEFAULT_CATALOG.specialties.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada área tiene servicios propios', () => {
    for (const specialty of DEFAULT_CATALOG.specialties) {
      const count = DEFAULT_CATALOG.services.filter(
        (service) => service.specialtyId === specialty.id,
      ).length
      expect(count, `El área ${specialty.id} no tiene servicios`).toBeGreaterThan(0)
    }
  })

  it('el pack de endodoncia suma endodoncia y reconstrucción', () => {
    // 10 (radiografía) + 120 (endodoncia unirradicular) + 90 (perno) = 220
    expect(formatUsd(computeBudget(itemsFromPack('pack_odonto_endodoncia')).totalUsd)).toBe(
      '$220.00',
    )
  })
})

describe('migrateCatalogDefaults', () => {
  it('añade los servicios nuevos que falten', () => {
    const legacy: Catalog = {
      categories: ['Honorarios Médicos'],
      services: [],
      packs: [],
      specialties: [],
      products: [],
    }

    const result = migrateCatalogDefaults(legacy)

    expect(result.services).toHaveLength(DEFAULT_SERVICES.length)
    expect(result.categories).toContain('Estudios y Diagnóstico')
    expect(result.packs.map((p) => p.id)).toContain('pack_chequeo_general')
  })

  it('añade las áreas de práctica que falten sin duplicarlas', () => {
    const legacy: Catalog = {
      categories: [],
      services: [],
      packs: [],
      specialties: [{ id: 'cirugia', name: 'Cirugía', titles: ['Dr.'] }],
      products: [],
    }

    const result = migrateCatalogDefaults(legacy)

    expect(result.specialties.map((s) => s.id)).toContain('odontologia')
    expect(result.specialties.filter((s) => s.id === 'cirugia')).toHaveLength(1)
    expect(result.specialties).toHaveLength(DEFAULT_CATALOG.specialties.length)
  })

  it('etiqueta con su área los servicios conocidos que aún no la tienen', () => {
    const legacy: Catalog = {
      categories: ['Honorarios Médicos'],
      services: [
        {
          id: 'svc_cirujano',
          category: 'Honorarios Médicos',
          concept: 'Cirujano Principal',
          formula: { type: 'fixed', amountUsd: 999 },
        },
      ],
      packs: [],
      specialties: [],
      products: [],
    }

    const result = migrateCatalogDefaults(legacy)
    const service = result.services.find((s) => s.id === 'svc_cirujano')!

    expect(service.specialtyId).toBe('cirugia')
    // El precio editado por el usuario se respeta.
    expect(service.formula).toEqual({ type: 'fixed', amountUsd: 999 })
  })

  it('mueve los servicios reorganizados si siguen en la categoría antigua', () => {
    const legacy: Catalog = {
      categories: ['Consultas y Procedimientos'],
      services: [
        {
          id: 'svc_ecografia',
          category: 'Consultas y Procedimientos',
          concept: 'Ecografía básica',
          formula: { type: 'fixed', amountUsd: 40 },
        },
      ],
      packs: [],
      specialties: [],
      products: [],
    }

    const result = migrateCatalogDefaults(legacy)

    expect(result.services.find((s) => s.id === 'svc_ecografia')!.category).toBe(
      'Estudios y Diagnóstico',
    )
    expect(result.categories).not.toContain('Consultas y Procedimientos')
  })

  it('respeta la categoría y el precio que el usuario editó', () => {
    const custom: Catalog = {
      categories: ['Mi categoría'],
      services: [
        {
          id: 'svc_ecografia',
          category: 'Mi categoría',
          concept: 'Ecografía',
          formula: { type: 'fixed', amountUsd: 99 },
        },
      ],
      packs: [],
      specialties: [],
      products: [],
    }

    const result = migrateCatalogDefaults(custom)
    const service = result.services.find((s) => s.id === 'svc_ecografia')!

    expect(service.category).toBe('Mi categoría')
    expect(service.formula).toEqual({ type: 'fixed', amountUsd: 99 })
    expect(result.categories).toContain('Mi categoría')
  })

  it('no duplica servicios ni packs cuando el catálogo ya está al día', () => {
    const result = migrateCatalogDefaults(cloneDefaultCatalog())

    expect(result.services).toHaveLength(DEFAULT_SERVICES.length)
    expect(new Set(result.services.map((s) => s.id)).size).toBe(result.services.length)
    expect(new Set(result.packs.map((p) => p.id)).size).toBe(result.packs.length)
    expect(new Set(result.specialties.map((s) => s.id)).size).toBe(
      result.specialties.length,
    )
    expect(new Set(result.products.map((p) => p.id)).size).toBe(result.products.length)
  })

  it('respeta el catálogo de productos editado por el usuario', () => {
    const custom: Catalog = {
      categories: [],
      services: [],
      packs: [],
      specialties: [],
      products: [
        {
          id: 'prod_mio',
          code: 'MIO',
          category: 'General',
          description: 'Bata personalizada',
          unit: 'UND',
          priceUsd: 99,
          taxRate: 8,
        },
      ],
    }

    const result = migrateCatalogDefaults(custom)

    expect(result.products.find((product) => product.id === 'prod_mio')).toEqual(
      custom.products[0],
    )
    expect(result.products.length).toBeGreaterThan(custom.products.length)
    expect(result.productCatalogVersion).toBe(2)
  })

  it('siembra los productos de ejemplo en un catálogo antiguo sin productos', () => {
    const legacy: Catalog = {
      categories: [],
      services: [],
      packs: [],
      specialties: [],
      products: [],
    }

    const result = migrateCatalogDefaults(legacy)

    expect(result.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(result.productCatalogVersion).toBe(2)
  })

  it('completa los productos de fábrica sin duplicar ni pisar precios', () => {
    const base = cloneDefaultCatalog()
    base.products = base.products.slice(0, 3).map((product, index) =>
      index === 0 ? { ...product, priceUsd: 123 } : product,
    )

    const result = mergeDefaultProducts(base)
    expect(result.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(result.products[0].priceUsd).toBe(123)

    const again = mergeDefaultProducts(result)
    expect(again.products).toHaveLength(DEFAULT_PRODUCTS.length)
  })

  it('el catálogo inicial está organizado por categorías y sin duplicados', () => {
    expect(DEFAULT_PRODUCTS).toHaveLength(78)
    expect(new Set(DEFAULT_PRODUCTS.map((product) => product.id)).size).toBe(
      DEFAULT_PRODUCTS.length,
    )
    expect(new Set(DEFAULT_PRODUCTS.map((product) => product.code)).size).toBe(
      DEFAULT_PRODUCTS.length,
    )

    for (const category of PRODUCT_CATEGORIES) {
      expect(
        DEFAULT_PRODUCTS.some((product) => product.category === category),
        `La categoría ${category} no tiene productos`,
      ).toBe(true)
    }
    expect(DEFAULT_PRODUCTS.every((product) => product.category.length > 0)).toBe(true)
  })

  it('amplía un catálogo con los 8 productos iniciales sin pisar precios editados', () => {
    const oldIds = [
      'prod_bata',
      'prod_cepillo',
      'prod_electrodo',
      'prod_gasa',
      'prod_guantes',
      'prod_cateter',
      'prod_hemostatico',
      'prod_seda',
    ]
    const oldProducts = oldIds.map((id) => {
      const product = DEFAULT_PRODUCTS.find((entry) => entry.id === id)
      if (!product) throw new Error(`Falta el producto inicial ${id}`)
      return { ...product, priceUsd: id === 'prod_bata' ? 99 : product.priceUsd }
    })
    const legacy: Catalog = {
      categories: [],
      services: [],
      packs: [],
      specialties: [],
      products: oldProducts,
    }

    const result = migrateCatalogDefaults(legacy)
    const bata = result.products.find((product) => product.id === 'prod_bata')

    expect(bata?.priceUsd).toBe(99)
    expect(result.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(result.productCatalogVersion).toBe(2)
  })
})
