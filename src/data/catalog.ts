import type { Catalog, CatalogService } from '@/types'

/**
 * Catálogo por defecto de una clínica pequeña venezolana.
 *
 * Precios orientativos en USD (la app los convierte a Bs. con la tasa BCV).
 * Los de honorarios y gastos de clínica vienen del presupuesto real de la
 * clínica; los de consultas, procedimientos, enfermería y estudios están
 * basados en referencias de mercado de Venezuela (2026), donde los estudios y
 * la enfermería son baratos y la consulta/cirugía concentran el costo.
 * Todo es editable desde "Gestionar catálogo".
 */

// ── Honorarios Médicos ────────────────────────────────────────────────────
const HONORARIOS_SERVICES: CatalogService[] = [
  {
    id: 'svc_cirujano',
    category: 'Honorarios Médicos',
    concept: 'Cirujano Principal',
    detail: 'Tarifa base acordada',
    formula: { type: 'fixed', amountUsd: 350 },
  },
  {
    id: 'svc_ayudante',
    category: 'Honorarios Médicos',
    concept: 'Ayudante y Anestesiólogo',
    detail: '50% de honorarios principales',
    formula: { type: 'percent_of_item', refConcept: 'Cirujano Principal', percent: 50 },
  },
  {
    id: 'svc_interconsulta',
    category: 'Honorarios Médicos',
    concept: 'Interconsulta',
    detail: 'Cobertura de 24 horas',
    formula: { type: 'fixed', amountUsd: 70 },
  },
  {
    id: 'svc_residente',
    category: 'Honorarios Médicos',
    concept: 'Residente',
    detail: 'Elaboración de historia clínica',
    formula: { type: 'fixed', amountUsd: 20 },
  },
]

// ── Gastos de Clínica ─────────────────────────────────────────────────────
const GASTOS_SERVICES: CatalogService[] = [
  {
    id: 'svc_circulantes',
    category: 'Gastos de Clínica',
    concept: 'Circulantes',
    detail: 'Asistencia en quirófano',
    formula: { type: 'qty_unit', qty: 2, unitUsd: 20 },
  },
  {
    id: 'svc_instrumentista',
    category: 'Gastos de Clínica',
    concept: 'Instrumentista',
    detail: 'Tarifa estándar por turno',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'svc_quirofano',
    category: 'Gastos de Clínica',
    concept: 'Derecho de Quirófano',
    detail: 'Estimado base por 2 horas',
    formula: { type: 'fixed', amountUsd: 180 },
  },
  {
    id: 'svc_monitoreo',
    category: 'Gastos de Clínica',
    concept: 'Monitoreo y Electrocuaterio',
    detail: 'Uso de equipos especiales',
    formula: { type: 'fixed', amountUsd: 60 },
  },
  {
    id: 'svc_material',
    category: 'Gastos de Clínica',
    concept: 'Material Médico Quirúrgico',
    detail: 'Kits, suturas, descartables',
    formula: { type: 'fixed', amountUsd: 250 },
  },
  {
    id: 'svc_hospitalizacion',
    category: 'Gastos de Clínica',
    concept: 'Hospitalización',
    detail: 'Habitación estándar (24 horas)',
    formula: { type: 'fixed', amountUsd: 90 },
  },
  {
    id: 'svc_enfermeria',
    category: 'Gastos de Clínica',
    concept: 'Asistencia Permanente Enf.',
    detail: 'Turnos rotativos (24h)',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'svc_historias',
    category: 'Gastos de Clínica',
    concept: 'Historias Clínicas y Desechos',
    detail: 'Papelería y manejo patológico',
    formula: { type: 'fixed', amountUsd: 25 },
  },
  {
    id: 'svc_admin',
    category: 'Gastos de Clínica',
    concept: 'Gastos de Administración',
    detail: 'Gastos administrativos y de uso clínico',
    formula: { type: 'fixed', amountUsd: 35 },
  },
]

// ── Consultas ─────────────────────────────────────────────────────────────
const CONSULTAS_SERVICES: CatalogService[] = [
  {
    id: 'svc_consulta_primera',
    category: 'Consultas',
    concept: 'Consulta de primera vez',
    detail: 'Evaluación inicial y plan',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'svc_consulta_control',
    category: 'Consultas',
    concept: 'Consulta de control',
    detail: 'Seguimiento del tratamiento',
    formula: { type: 'fixed', amountUsd: 25 },
  },
  {
    id: 'svc_consulta_especialista',
    category: 'Consultas',
    concept: 'Consulta de especialista',
    detail: 'Evaluación por especialista',
    formula: { type: 'fixed', amountUsd: 45 },
  },
  {
    id: 'svc_consulta_emergencia',
    category: 'Consultas',
    concept: 'Consulta de emergencia',
    detail: 'Atención inicial en emergencia',
    formula: { type: 'fixed', amountUsd: 50 },
  },
  {
    id: 'svc_eval_preoperatoria',
    category: 'Consultas',
    concept: 'Evaluación preoperatoria',
    detail: 'Evaluación preanestésica',
    formula: { type: 'fixed', amountUsd: 35 },
  },
  {
    id: 'svc_certificado',
    category: 'Consultas',
    concept: 'Certificado / Informe médico',
    detail: 'Documento médico',
    formula: { type: 'fixed', amountUsd: 25 },
  },
]

// ── Procedimientos Ambulatorios ───────────────────────────────────────────
const PROCEDIMIENTOS_SERVICES: CatalogService[] = [
  {
    id: 'svc_curacion',
    category: 'Procedimientos Ambulatorios',
    concept: 'Curación / Sutura',
    detail: 'Procedimiento menor',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'svc_sutura',
    category: 'Procedimientos Ambulatorios',
    concept: 'Sutura de herida',
    detail: 'Síntesis de herida (según extensión)',
    formula: { type: 'fixed', amountUsd: 55 },
  },
  {
    id: 'svc_drenaje',
    category: 'Procedimientos Ambulatorios',
    concept: 'Drenaje de absceso',
    detail: 'Incisión y drenaje',
    formula: { type: 'fixed', amountUsd: 50 },
  },
  {
    id: 'svc_retiro_puntos',
    category: 'Procedimientos Ambulatorios',
    concept: 'Retiro de puntos',
    detail: 'Retiro de sutura',
    formula: { type: 'fixed', amountUsd: 15 },
  },
  {
    id: 'svc_sonda',
    category: 'Procedimientos Ambulatorios',
    concept: 'Colocación de sonda vesical',
    detail: 'Sondaje vesical',
    formula: { type: 'fixed', amountUsd: 30 },
  },
  {
    id: 'svc_yeso',
    category: 'Procedimientos Ambulatorios',
    concept: 'Inmovilización / yeso',
    detail: 'Ferulización o yeso',
    formula: { type: 'fixed', amountUsd: 50 },
  },
  {
    id: 'svc_lavado_oido',
    category: 'Procedimientos Ambulatorios',
    concept: 'Lavado de oído',
    detail: 'Extracción de cerumen',
    formula: { type: 'fixed', amountUsd: 15 },
  },
  {
    id: 'svc_onicectomia',
    category: 'Procedimientos Ambulatorios',
    concept: 'Extracción de uña',
    detail: 'Onicectomía parcial',
    formula: { type: 'fixed', amountUsd: 40 },
  },
]

// ── Enfermería ────────────────────────────────────────────────────────────
const ENFERMERIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_inyeccion',
    category: 'Enfermería',
    concept: 'Inyección o Nebulización',
    detail: 'Procedimiento ambulatorio',
    formula: { type: 'fixed', amountUsd: 15 },
  },
  {
    id: 'svc_vendaje',
    category: 'Enfermería',
    concept: 'Vendaje simple',
    detail: 'Curación y vendaje',
    formula: { type: 'fixed', amountUsd: 12 },
  },
  {
    id: 'svc_venopuncion',
    category: 'Enfermería',
    concept: 'Toma de muestra (venopunción)',
    detail: 'Extracción de sangre',
    formula: { type: 'fixed', amountUsd: 8 },
  },
  {
    id: 'svc_vacuna',
    category: 'Enfermería',
    concept: 'Aplicación de vacuna',
    detail: 'Administración de dosis',
    formula: { type: 'fixed', amountUsd: 10 },
  },
  {
    id: 'svc_oxigenoterapia',
    category: 'Enfermería',
    concept: 'Oxigenoterapia',
    detail: 'Por hora',
    formula: { type: 'fixed', amountUsd: 15 },
  },
]

// ── Estudios y Diagnóstico ────────────────────────────────────────────────
const ESTUDIOS_SERVICES: CatalogService[] = [
  {
    id: 'svc_ecografia',
    category: 'Estudios y Diagnóstico',
    concept: 'Ecografía básica',
    detail: 'Estudio de imagen simple',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'svc_ecg',
    category: 'Estudios y Diagnóstico',
    concept: 'Electrocardiograma',
    detail: 'ECG en reposo',
    formula: { type: 'fixed', amountUsd: 12 },
  },
  {
    id: 'svc_eco_pelvica',
    category: 'Estudios y Diagnóstico',
    concept: 'Ecografía pélvica / obstétrica',
    detail: 'Estudio ginecológico',
    formula: { type: 'fixed', amountUsd: 25 },
  },
  {
    id: 'svc_ecocardiograma',
    category: 'Estudios y Diagnóstico',
    concept: 'Ecocardiograma',
    detail: 'Ecocardiograma transtorácico',
    formula: { type: 'fixed', amountUsd: 30 },
  },
  {
    id: 'svc_rayosx',
    category: 'Estudios y Diagnóstico',
    concept: 'Rayos X',
    detail: 'Por incidencia',
    formula: { type: 'fixed', amountUsd: 20 },
  },
  {
    id: 'svc_hematologia',
    category: 'Estudios y Diagnóstico',
    concept: 'Hematología completa',
    detail: 'Biometría hemática',
    formula: { type: 'fixed', amountUsd: 5 },
  },
  {
    id: 'svc_perfil20',
    category: 'Estudios y Diagnóstico',
    concept: 'Perfil 20 (química sanguínea)',
    detail: 'Química sanguínea',
    formula: { type: 'fixed', amountUsd: 12 },
  },
  {
    id: 'svc_prueba_rapida',
    category: 'Estudios y Diagnóstico',
    concept: 'Prueba rápida',
    detail: 'Embarazo / dengue / VIH',
    formula: { type: 'fixed', amountUsd: 10 },
  },
]

/** Categorías por defecto, en el orden en que se muestran. */
export const DEFAULT_CATEGORIES = [
  'Honorarios Médicos',
  'Gastos de Clínica',
  'Consultas',
  'Procedimientos Ambulatorios',
  'Enfermería',
  'Estudios y Diagnóstico',
]

/** Servicios de la biblioteca de tarifas de la clínica. */
export const DEFAULT_SERVICES: CatalogService[] = [
  ...HONORARIOS_SERVICES,
  ...GASTOS_SERVICES,
  ...CONSULTAS_SERVICES,
  ...PROCEDIMIENTOS_SERVICES,
  ...ENFERMERIA_SERVICES,
  ...ESTUDIOS_SERVICES,
]

const idsInCategory = (category: string) =>
  DEFAULT_SERVICES.filter((service) => service.category === category).map(
    (service) => service.id,
  )

/** Categoría antigua que se reorganizó en categorías más específicas. */
const LEGACY_CATEGORY = 'Consultas y Procedimientos'

/** Servicios que cambiaron de categoría (id → categoría nueva). */
const MOVED_CATEGORY: Record<string, string> = {
  svc_consulta_primera: 'Consultas',
  svc_consulta_control: 'Consultas',
  svc_certificado: 'Consultas',
  svc_curacion: 'Procedimientos Ambulatorios',
  svc_inyeccion: 'Enfermería',
  svc_ecografia: 'Estudios y Diagnóstico',
}

/** Catálogo inicial: los servicios de la clínica y sus plantillas. */
export const DEFAULT_CATALOG: Catalog = {
  categories: [...DEFAULT_CATEGORIES],
  services: DEFAULT_SERVICES,
  packs: [
    {
      id: 'pack_cirugia_base',
      name: 'Cirugía — plantilla base',
      description: 'Set completo de honorarios y gastos para una cirugía estándar.',
      services: idsInCategory('Honorarios Médicos')
        .concat(idsInCategory('Gastos de Clínica'))
        .map((serviceId) => ({ serviceId })),
    },
    {
      id: 'pack_consulta',
      name: 'Consulta y procedimientos',
      description: 'Consulta con procedimientos menores del día a día.',
      services: [
        'svc_consulta_primera',
        'svc_consulta_control',
        'svc_curacion',
        'svc_inyeccion',
        'svc_certificado',
        'svc_ecografia',
      ].map((serviceId) => ({ serviceId })),
    },
    {
      id: 'pack_chequeo_general',
      name: 'Chequeo general',
      description: 'Consulta con electrocardiograma y laboratorio básico.',
      services: [
        'svc_consulta_primera',
        'svc_ecg',
        'svc_hematologia',
        'svc_perfil20',
      ].map((serviceId) => ({ serviceId })),
    },
    {
      id: 'pack_procedimiento_menor',
      name: 'Procedimiento menor',
      description: 'Curación, medicación y vendaje ambulatorio.',
      services: ['svc_curacion', 'svc_inyeccion', 'svc_vendaje'].map((serviceId) => ({
        serviceId,
      })),
    },
  ],
}

/** Copia profunda del catálogo inicial (para "restablecer"). */
export function cloneDefaultCatalog(): Catalog {
  return structuredClone(DEFAULT_CATALOG)
}

/**
 * Ajusta un catálogo guardado al modelo actual **sin sobrescribir** lo que el
 * usuario haya editado:
 *  1. Añade los servicios nuevos que falten.
 *  2. Mueve los servicios reorganizados si siguen en la categoría antigua.
 *  3. Reordena las categorías añadiendo las nuevas y limpia la antigua si vacía.
 *  4. Añade las plantillas nuevas que falten.
 */
export function migrateCatalogDefaults(catalog: Catalog): Catalog {
  const existing = new Set(catalog.services.map((service) => service.id))

  const services = [...catalog.services]
  for (const service of DEFAULT_SERVICES) {
    if (!existing.has(service.id)) services.push(structuredClone(service))
  }

  const relocated = services.map((service) => {
    const nextCategory = MOVED_CATEGORY[service.id]
    if (nextCategory && service.category === LEGACY_CATEGORY) {
      return { ...service, category: nextCategory }
    }
    return service
  })

  const usedCategories = new Set(relocated.map((service) => service.category))
  const categories = [
    ...DEFAULT_CATEGORIES,
    ...catalog.categories.filter(
      (category) =>
        !DEFAULT_CATEGORIES.includes(category) &&
        !(category === LEGACY_CATEGORY && !usedCategories.has(category)),
    ),
  ]

  const packs = [...catalog.packs]
  for (const pack of DEFAULT_CATALOG.packs) {
    if (!packs.some((entry) => entry.id === pack.id)) {
      packs.push(structuredClone(pack))
    }
  }

  return { categories, services: relocated, packs }
}
