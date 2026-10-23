import type { Product } from '@/types'

/**
 * Catálogo inicial de productos para cotizaciones.
 *
 * Son insumos de ejemplo basados en la hoja de referencia: se pueden editar,
 * borrar o reemplazar desde «Gestionar catálogo → Productos». Los precios son
 * la base sin IVA; el porcentaje de IVA se aplica por línea.
 */
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_bata',
    code: 'BAYP',
    description: 'Bata de pacientes 30 grs. Talla M',
    unit: 'UND',
    priceUsd: 6.8,
    taxRate: 16,
  },
  {
    id: 'prod_cepillo',
    code: 'BACNPS',
    description: 'Cepillo clorhexidina 4 % 50 ml',
    unit: 'UND',
    priceUsd: 2.5,
    taxRate: 16,
  },
  {
    id: 'prod_electrodo',
    code: 'CEPC',
    description: 'Electrodo adulto para monitor cardíaco',
    unit: 'UND',
    priceUsd: 0.72,
    taxRate: 16,
  },
  {
    id: 'prod_gasa',
    code: 'ELAP7',
    description: 'Gasa estéril 10 × 10 cm',
    unit: 'PAQ',
    priceUsd: 7,
    taxRate: 16,
  },
  {
    id: 'prod_guantes',
    code: 'ONT1G5',
    description: 'Guantes de nitrilo talla M',
    unit: 'CAJA',
    priceUsd: 3.8,
    taxRate: 16,
  },
  {
    id: 'prod_cateter',
    code: 'MHEA2',
    description: 'Catéter epidural 16 G',
    unit: 'UND',
    priceUsd: 1.71,
    taxRate: 16,
  },
  {
    id: 'prod_hemostatico',
    code: 'CAEP',
    description: 'Agente hemostático absorbible',
    unit: 'UND',
    priceUsd: 270,
    taxRate: 16,
  },
  {
    id: 'prod_seda',
    code: 'COLA',
    description: 'Seda quirúrgica 2-0',
    unit: 'UND',
    priceUsd: 3.35,
    taxRate: 16,
  },
]
