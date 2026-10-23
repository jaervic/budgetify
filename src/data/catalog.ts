import type { Catalog, CatalogService } from '@/types'
import { DEFAULT_PRODUCTS } from '@/data/products'
import { DEFAULT_SPECIALTIES } from '@/data/specialties'

/**
 * Catálogo por defecto de un consultorio venezolano.
 *
 * Precios orientativos en USD (la app los convierte a Bs. con la tasa BCV).
 * Los de honorarios y gastos de clínica vienen del presupuesto real de la
 * clínica; el resto está basado en referencias públicas de mercado de Venezuela
 * (2026), donde los estudios y la enfermería son baratos y la consulta, la
 * cirugía y la odontología concentran el costo.
 *
 * Los precios de cirugía general son los menos documentados: van como punto de
 * partida y están pensados para que se editen. **Todo es editable** desde
 * "Gestionar catálogo" y nada de esto se envía a ningún servidor.
 *
 * Organización por áreas (`specialtyId`):
 *  - Con área: propios de esa especialidad.
 *  - Sin área: transversales, se ofrecen a todas las áreas (enfermería,
 *    estudios, gastos de clínica, procedimientos ambulatorios).
 */

// ── Honorarios Médicos (área: Cirugía) ────────────────────────────────────
const HONORARIOS_SERVICES: CatalogService[] = [
  {
    id: 'svc_cirujano',
    category: 'Honorarios Médicos',
    concept: 'Cirujano Principal',
    detail: 'Tarifa base acordada',
    formula: { type: 'fixed', amountUsd: 350 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_ayudante',
    category: 'Honorarios Médicos',
    concept: 'Ayudante y Anestesiólogo',
    detail: '50% de honorarios principales',
    formula: { type: 'percent_of_item', refConcept: 'Cirujano Principal', percent: 50 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_interconsulta',
    category: 'Honorarios Médicos',
    concept: 'Interconsulta',
    detail: 'Cobertura de 24 horas',
    formula: { type: 'fixed', amountUsd: 70 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_residente',
    category: 'Honorarios Médicos',
    concept: 'Residente',
    detail: 'Elaboración de historia clínica',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'cirugia',
  },
]

// ── Gastos de Clínica (transversal) ───────────────────────────────────────
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

// ── Cirugía · Procedimientos (área: Cirugía) ──────────────────────────────
const CIRUGIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_cx_colecistectomia',
    category: 'Cirugía · Procedimientos',
    concept: 'Colecistectomía (honorarios)',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 450 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_cx_herniorrafia',
    category: 'Cirugía · Procedimientos',
    concept: 'Herniorrafia inguinal (honorarios)',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 400 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_cx_apendicectomia',
    category: 'Cirugía · Procedimientos',
    concept: 'Apendicectomía (honorarios)',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 400 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_cx_tiroidectomia',
    category: 'Cirugía · Procedimientos',
    concept: 'Tiroidectomía (honorarios)',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 600 },
    specialtyId: 'cirugia',
  },
  {
    id: 'svc_cx_laparoscopia',
    category: 'Cirugía · Procedimientos',
    concept: 'Adicional por laparoscopia',
    detail: 'Insumos y técnica',
    formula: { type: 'fixed', amountUsd: 150 },
    specialtyId: 'cirugia',
  },
]

// ── Consultas (área: Medicina General) ────────────────────────────────────
const CONSULTAS_SERVICES: CatalogService[] = [
  {
    id: 'svc_consulta_primera',
    category: 'Consultas',
    concept: 'Consulta de primera vez',
    detail: 'Evaluación inicial y plan',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_consulta_control',
    category: 'Consultas',
    concept: 'Consulta de control',
    detail: 'Seguimiento del tratamiento',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_consulta_especialista',
    category: 'Consultas',
    concept: 'Consulta de especialista',
    detail: 'Evaluación por especialista',
    formula: { type: 'fixed', amountUsd: 45 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_consulta_emergencia',
    category: 'Consultas',
    concept: 'Consulta de emergencia',
    detail: 'Atención inicial en emergencia',
    formula: { type: 'fixed', amountUsd: 50 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_eval_preoperatoria',
    category: 'Consultas',
    concept: 'Evaluación preoperatoria',
    detail: 'Evaluación preanestésica',
    formula: { type: 'fixed', amountUsd: 35 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_certificado',
    category: 'Consultas',
    concept: 'Certificado / Informe médico',
    detail: 'Documento médico',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'medicina-general',
  },
]

// ── Medicina General (área: Medicina General) ─────────────────────────────
const MEDICINA_GENERAL_SERVICES: CatalogService[] = [
  {
    id: 'svc_mg_consulta',
    category: 'Medicina General',
    concept: 'Consulta médica general',
    detail: 'Evaluación inicial del paciente',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_control',
    category: 'Medicina General',
    concept: 'Consulta de control',
    detail: 'Seguimiento del cuadro',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_cronico',
    category: 'Medicina General',
    concept: 'Control de paciente crónico',
    detail: 'Hipertensión, diabetes y similares',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_domiciliaria',
    category: 'Medicina General',
    concept: 'Visita domiciliaria',
    detail: 'Atención en el domicilio del paciente',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_certificado',
    category: 'Medicina General',
    concept: 'Certificado de salud',
    detail: 'Constancia médica',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_reposo',
    category: 'Medicina General',
    concept: 'Reposo / justificativo',
    detail: 'Constancia de reposo médico',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'medicina-general',
  },
  {
    id: 'svc_mg_referencia',
    category: 'Medicina General',
    concept: 'Referencia a especialista',
    detail: 'Interconsulta con informe',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'medicina-general',
  },
]

// ── Odontología · Consulta y Diagnóstico ──────────────────────────────────
const ODONTO_CONSULTA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_consulta',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Consulta odontológica',
    detail: 'Evaluación inicial y plan',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_urgencia',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Consulta de urgencia (dolor)',
    detail: 'Atención del dolor agudo',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_rx_periapical',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Radiografía periapical',
    detail: 'Por pieza dental',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_rx_panoramica',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Radiografía panorámica',
    detail: 'Estudio completo de las arcadas',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_plan',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Estudio y plan de tratamiento',
    detail: 'Presupuesto detallado',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_interconsulta',
    category: 'Odontología · Consulta y Diagnóstico',
    concept: 'Interconsulta odontológica',
    detail: 'Evaluación por especialista',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Restauradora ────────────────────────────────────────────
const ODONTO_RESTAURADORA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_profilaxis',
    category: 'Odontología · Restauradora',
    concept: 'Profilaxis (limpieza)',
    detail: 'Limpieza ultrasónica y pulido',
    formula: { type: 'fixed', amountUsd: 30 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_destartraje',
    category: 'Odontología · Restauradora',
    concept: 'Destartraje por cuadrante',
    detail: 'Limpieza profunda',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_resina_simple',
    category: 'Odontología · Restauradora',
    concept: 'Resina simple',
    detail: 'Obturación de 1 superficie',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_resina_compuesta',
    category: 'Odontología · Restauradora',
    concept: 'Resina compuesta',
    detail: 'Obturación de 2 a 3 superficies',
    formula: { type: 'fixed', amountUsd: 55 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_perno',
    category: 'Odontología · Restauradora',
    concept: 'Reconstrucción con perno muñón',
    detail: 'Reconstrucción post-endodoncia',
    formula: { type: 'fixed', amountUsd: 90 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_sellante',
    category: 'Odontología · Restauradora',
    concept: 'Sellante de fosas y fisuras',
    detail: 'Prevención (por diente)',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Endodoncia ──────────────────────────────────────────────
const ODONTO_ENDODONCIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_endo_uni',
    category: 'Odontología · Endodoncia',
    concept: 'Endodoncia unirradicular',
    detail: '1 conducto (incisivos y caninos)',
    formula: { type: 'fixed', amountUsd: 120 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_endo_bi',
    category: 'Odontología · Endodoncia',
    concept: 'Endodoncia birradicular',
    detail: '2 conductos (premolares)',
    formula: { type: 'fixed', amountUsd: 180 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_endo_multi',
    category: 'Odontología · Endodoncia',
    concept: 'Endodoncia multirradicular',
    detail: '3 a 4 conductos (molares)',
    formula: { type: 'fixed', amountUsd: 250 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_endo_retrat',
    category: 'Odontología · Endodoncia',
    concept: 'Retratamiento endodóntico',
    detail: 'Conducto previamente tratado',
    formula: { type: 'fixed', amountUsd: 300 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_endo_urgencia',
    category: 'Odontología · Endodoncia',
    concept: 'Apertura de urgencia y medicación',
    detail: 'Drenaje y medicación intraconducto',
    formula: { type: 'fixed', amountUsd: 50 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Cirugía Oral ────────────────────────────────────────────
const ODONTO_CIRUGIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_extraccion',
    category: 'Odontología · Cirugía Oral',
    concept: 'Extracción simple',
    detail: 'Pieza erupcionada',
    formula: { type: 'fixed', amountUsd: 35 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_extraccion_qx',
    category: 'Odontología · Cirugía Oral',
    concept: 'Extracción quirúrgica',
    detail: 'Pieza incluida o de difícil acceso',
    formula: { type: 'fixed', amountUsd: 90 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_tercer_molar',
    category: 'Odontología · Cirugía Oral',
    concept: 'Tercer molar impactado',
    detail: 'Cirugía de muela del juicio',
    formula: { type: 'fixed', amountUsd: 150 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_biopsia',
    category: 'Odontología · Cirugía Oral',
    concept: 'Biopsia de lesión oral',
    detail: 'Toma y estudio histopatológico',
    formula: { type: 'fixed', amountUsd: 80 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_frenectomia',
    category: 'Odontología · Cirugía Oral',
    concept: 'Frenectomía',
    detail: 'Liberación de frenillo',
    formula: { type: 'fixed', amountUsd: 120 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Periodoncia ─────────────────────────────────────────────
const ODONTO_PERIODONCIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_curetaje',
    category: 'Odontología · Periodoncia',
    concept: 'Curetaje y alisado radicular',
    detail: 'Por cuadrante',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_colgajo',
    category: 'Odontología · Periodoncia',
    concept: 'Colgajo periodontal',
    detail: 'Cirugía periodontal por cuadrante',
    formula: { type: 'fixed', amountUsd: 120 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_cauterizacion',
    category: 'Odontología · Periodoncia',
    concept: 'Cauterización gingival',
    detail: 'Ajuste de tejido blando',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Ortodoncia ──────────────────────────────────────────────
const ODONTO_ORTODONCIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_orto_estudio',
    category: 'Odontología · Ortodoncia',
    concept: 'Estudio de ortodoncia',
    detail: 'Radiografías, modelos y plan',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_orto_metal',
    category: 'Odontología · Ortodoncia',
    concept: 'Instalación de brackets metálicos',
    detail: 'Aparatología estándar',
    formula: { type: 'fixed', amountUsd: 250 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_orto_estetico',
    category: 'Odontología · Ortodoncia',
    concept: 'Instalación de brackets estéticos',
    detail: 'Cerámica o zafiro',
    formula: { type: 'fixed', amountUsd: 400 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_orto_control',
    category: 'Odontología · Ortodoncia',
    concept: 'Control mensual de ortodoncia',
    detail: 'Ajuste programado',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_orto_retiro',
    category: 'Odontología · Ortodoncia',
    concept: 'Retiro de brackets y retenedores',
    detail: 'Incluye contención',
    formula: { type: 'fixed', amountUsd: 80 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Estética y Prótesis ─────────────────────────────────────
const ODONTO_ESTETICA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_blanqueamiento',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Blanqueamiento en consultorio',
    detail: 'Sesión con luz LED',
    formula: { type: 'fixed', amountUsd: 90 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_blanqueamiento_amb',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Blanqueamiento ambulatorio',
    detail: 'Kit con férulas a medida',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_corona_porcelana',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Corona de porcelana',
    detail: 'Por pieza',
    formula: { type: 'fixed', amountUsd: 200 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_corona_metal',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Corona metal-porcelana',
    detail: 'Por pieza',
    formula: { type: 'fixed', amountUsd: 150 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_carilla',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Carilla de porcelana',
    detail: 'Por pieza',
    formula: { type: 'fixed', amountUsd: 250 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_protesis_parcial',
    category: 'Odontología · Estética y Prótesis',
    concept: 'Prótesis parcial removible',
    detail: 'Por arcada',
    formula: { type: 'fixed', amountUsd: 200 },
    specialtyId: 'odontologia',
  },
]

// ── Odontología · Odontopediatría ─────────────────────────────────────────
const ODONTO_PEDIATRIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_odo_ped_consulta',
    category: 'Odontología · Odontopediatría',
    concept: 'Consulta odontopediátrica',
    detail: 'Evaluación del niño',
    formula: { type: 'fixed', amountUsd: 12 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_ped_profilaxis',
    category: 'Odontología · Odontopediatría',
    concept: 'Profilaxis y flúor',
    detail: 'Prevención en dentición primaria',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_ped_pulpotomia',
    category: 'Odontología · Odontopediatría',
    concept: 'Pulpotomía',
    detail: 'Terapia pulpar en dentición primaria',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'odontologia',
  },
  {
    id: 'svc_odo_ped_corona',
    category: 'Odontología · Odontopediatría',
    concept: 'Corona de acero',
    detail: 'Dentición primaria',
    formula: { type: 'fixed', amountUsd: 70 },
    specialtyId: 'odontologia',
  },
]

// ── Traumatología y Ortopedia ─────────────────────────────────────────────
const TRAUMATOLOGIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_trau_consulta',
    category: 'Traumatología y Ortopedia',
    concept: 'Consulta traumatológica',
    detail: 'Evaluación y plan de tratamiento',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_control',
    category: 'Traumatología y Ortopedia',
    concept: 'Consulta de control postoperatorio',
    detail: 'Seguimiento de la evolución',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_inmovilizacion',
    category: 'Traumatología y Ortopedia',
    concept: 'Inmovilización con férula',
    detail: 'Férula o vendaje enyesado',
    formula: { type: 'fixed', amountUsd: 50 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_yeso_mi',
    category: 'Traumatología y Ortopedia',
    concept: 'Yeso de miembro inferior',
    detail: 'Yeso completo',
    formula: { type: 'fixed', amountUsd: 70 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_reduccion',
    category: 'Traumatología y Ortopedia',
    concept: 'Reducción cerrada de fractura',
    detail: 'Sin cirugía',
    formula: { type: 'fixed', amountUsd: 80 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_infiltracion',
    category: 'Traumatología y Ortopedia',
    concept: 'Infiltración articular',
    detail: 'Por articulación',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_artrocentesis',
    category: 'Traumatología y Ortopedia',
    concept: 'Artrocentesis',
    detail: 'Punción y drenaje articular',
    formula: { type: 'fixed', amountUsd: 50 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_retiro_material',
    category: 'Traumatología y Ortopedia',
    concept: 'Retiro de material de osteosíntesis',
    detail: 'Honorarios (gastos de clínica aparte)',
    formula: { type: 'fixed', amountUsd: 250 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_artroscopia',
    category: 'Traumatología y Ortopedia',
    concept: 'Artroscopia de rodilla',
    detail: 'Honorarios (gastos de clínica aparte)',
    formula: { type: 'fixed', amountUsd: 450 },
    specialtyId: 'traumatologia',
  },
  {
    id: 'svc_trau_osteosintesis',
    category: 'Traumatología y Ortopedia',
    concept: 'Osteosíntesis de fractura',
    detail: 'Honorarios (gastos de clínica aparte)',
    formula: { type: 'fixed', amountUsd: 500 },
    specialtyId: 'traumatologia',
  },
]

// ── Pediatría ─────────────────────────────────────────────────────────────
const PEDIATRIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_ped_consulta',
    category: 'Pediatría',
    concept: 'Consulta pediátrica',
    detail: 'Evaluación integral del niño',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_nino_sano',
    category: 'Pediatría',
    concept: 'Control de niño sano',
    detail: 'Crecimiento y desarrollo',
    formula: { type: 'fixed', amountUsd: 15 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_constancia',
    category: 'Pediatría',
    concept: 'Constancia de niño sano',
    detail: 'Con resultados de laboratorio recientes',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_escolar',
    category: 'Pediatría',
    concept: 'Certificado de salud escolar',
    detail: 'Requerido por el colegio',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_crecimiento',
    category: 'Pediatría',
    concept: 'Evaluación de crecimiento',
    detail: 'Curvas y percentiles',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_urgencia',
    category: 'Pediatría',
    concept: 'Consulta de urgencia pediátrica',
    detail: 'Atención el mismo día',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'pediatria',
  },
  {
    id: 'svc_ped_vacuna',
    category: 'Pediatría',
    concept: 'Vacunación pediátrica',
    detail: 'Aplicación de dosis',
    formula: { type: 'fixed', amountUsd: 10 },
    specialtyId: 'pediatria',
  },
]

// ── Ginecología y Obstetricia ─────────────────────────────────────────────
const GINECOLOGIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_gine_consulta',
    category: 'Ginecología y Obstetricia',
    concept: 'Consulta ginecológica',
    detail: 'Evaluación y plan',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_prenatal',
    category: 'Ginecología y Obstetricia',
    concept: 'Control prenatal',
    detail: 'Consulta de control del embarazo',
    formula: { type: 'fixed', amountUsd: 20 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_citologia',
    category: 'Ginecología y Obstetricia',
    concept: 'Citología (Papanicolau)',
    detail: 'Toma de muestra',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_colposcopia',
    category: 'Ginecología y Obstetricia',
    concept: 'Colposcopia',
    detail: 'Estudio del cuello uterino',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_eco_pelvica',
    category: 'Ginecología y Obstetricia',
    concept: 'Ecografía ginecológica',
    detail: 'Estudio por vía abdominal',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_eco_transvaginal',
    category: 'Ginecología y Obstetricia',
    concept: 'Ecografía transvaginal',
    detail: 'Estudio de alta resolución',
    formula: { type: 'fixed', amountUsd: 30 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_eco_obstetrica',
    category: 'Ginecología y Obstetricia',
    concept: 'Ecografía obstétrica',
    detail: 'Evaluación del feto',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_diu',
    category: 'Ginecología y Obstetricia',
    concept: 'Inserción de DIU',
    detail: 'Incluye el dispositivo',
    formula: { type: 'fixed', amountUsd: 60 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_diu_retiro',
    category: 'Ginecología y Obstetricia',
    concept: 'Retiro de DIU',
    detail: 'Retiro y control posterior',
    formula: { type: 'fixed', amountUsd: 30 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_cauterizacion',
    category: 'Ginecología y Obstetricia',
    concept: 'Cauterización cervical',
    detail: 'Lesiones benignas del cuello',
    formula: { type: 'fixed', amountUsd: 80 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_parto',
    category: 'Ginecología y Obstetricia',
    concept: 'Honorarios de parto natural',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 300 },
    specialtyId: 'ginecologia',
  },
  {
    id: 'svc_gine_cesarea',
    category: 'Ginecología y Obstetricia',
    concept: 'Honorarios de cesárea',
    detail: 'Gastos de clínica aparte',
    formula: { type: 'fixed', amountUsd: 400 },
    specialtyId: 'ginecologia',
  },
]

// ── Dermatología ──────────────────────────────────────────────────────────
const DERMATOLOGIA_SERVICES: CatalogService[] = [
  {
    id: 'svc_derma_consulta',
    category: 'Dermatología',
    concept: 'Consulta dermatológica',
    detail: 'Evaluación clínica de la piel',
    formula: { type: 'fixed', amountUsd: 35 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_dermatoscopia',
    category: 'Dermatología',
    concept: 'Dermatoscopia',
    detail: 'Estudio de lunares y lesiones',
    formula: { type: 'fixed', amountUsd: 25 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_consulta_dermatoscopia',
    category: 'Dermatología',
    concept: 'Consulta + dermatoscopia',
    detail: 'Paquete combinado',
    formula: { type: 'fixed', amountUsd: 45 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_crioterapia',
    category: 'Dermatología',
    concept: 'Crioterapia (1 a 3 lesiones)',
    detail: 'Nitrógeno líquido',
    formula: { type: 'fixed', amountUsd: 40 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_crioterapia_multi',
    category: 'Dermatología',
    concept: 'Crioterapia múltiple',
    detail: 'Más de 3 lesiones',
    formula: { type: 'fixed', amountUsd: 70 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_biopsia',
    category: 'Dermatología',
    concept: 'Biopsia de piel',
    detail: 'Toma y estudio histopatológico',
    formula: { type: 'fixed', amountUsd: 80 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_exeresis',
    category: 'Dermatología',
    concept: 'Exéresis de lesión cutánea',
    detail: 'Extirpación con sutura',
    formula: { type: 'fixed', amountUsd: 120 },
    specialtyId: 'dermatologia',
  },
  {
    id: 'svc_derma_peeling',
    category: 'Dermatología',
    concept: 'Peeling químico superficial',
    detail: 'Sesión',
    formula: { type: 'fixed', amountUsd: 90 },
    specialtyId: 'dermatologia',
  },
]

// ── Procedimientos Ambulatorios (transversal) ─────────────────────────────
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

// ── Enfermería (transversal) ──────────────────────────────────────────────
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

// ── Estudios y Diagnóstico (transversal) ──────────────────────────────────
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
  'Cirugía · Procedimientos',
  'Consultas',
  'Medicina General',
  'Odontología · Consulta y Diagnóstico',
  'Odontología · Restauradora',
  'Odontología · Endodoncia',
  'Odontología · Cirugía Oral',
  'Odontología · Periodoncia',
  'Odontología · Ortodoncia',
  'Odontología · Estética y Prótesis',
  'Odontología · Odontopediatría',
  'Traumatología y Ortopedia',
  'Pediatría',
  'Ginecología y Obstetricia',
  'Dermatología',
  'Procedimientos Ambulatorios',
  'Enfermería',
  'Estudios y Diagnóstico',
]

/** Servicios de la biblioteca de tarifas de la clínica. */
export const DEFAULT_SERVICES: CatalogService[] = [
  ...HONORARIOS_SERVICES,
  ...GASTOS_SERVICES,
  ...CIRUGIA_SERVICES,
  ...CONSULTAS_SERVICES,
  ...MEDICINA_GENERAL_SERVICES,
  ...ODONTO_CONSULTA_SERVICES,
  ...ODONTO_RESTAURADORA_SERVICES,
  ...ODONTO_ENDODONCIA_SERVICES,
  ...ODONTO_CIRUGIA_SERVICES,
  ...ODONTO_PERIODONCIA_SERVICES,
  ...ODONTO_ORTODONCIA_SERVICES,
  ...ODONTO_ESTETICA_SERVICES,
  ...ODONTO_PEDIATRIA_SERVICES,
  ...TRAUMATOLOGIA_SERVICES,
  ...PEDIATRIA_SERVICES,
  ...GINECOLOGIA_SERVICES,
  ...DERMATOLOGIA_SERVICES,
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

/** Área de cada servicio por defecto (para etiquetar catálogos ya guardados). */
const DEFAULT_SPECIALTY_BY_SERVICE: Record<string, string> = Object.fromEntries(
  DEFAULT_SERVICES.filter((service) => service.specialtyId).map((service) => [
    service.id,
    service.specialtyId as string,
  ]),
)

/** Catálogo inicial: los servicios del consultorio y sus plantillas. */
export const DEFAULT_CATALOG: Catalog = {
  categories: [...DEFAULT_CATEGORIES],
  services: DEFAULT_SERVICES,
  specialties: DEFAULT_SPECIALTIES.map((specialty) => ({ ...specialty })),
  products: structuredClone(DEFAULT_PRODUCTS),
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
      services: ['svc_consulta_primera', 'svc_ecg', 'svc_hematologia', 'svc_perfil20'].map(
        (serviceId) => ({ serviceId }),
      ),
    },
    {
      id: 'pack_procedimiento_menor',
      name: 'Procedimiento menor',
      description: 'Curación, medicación y vendaje ambulatorio.',
      services: ['svc_curacion', 'svc_inyeccion', 'svc_vendaje'].map((serviceId) => ({
        serviceId,
      })),
    },
    {
      id: 'pack_odonto_consulta',
      name: 'Odontología — primera consulta',
      description: 'Evaluación completa con radiografía panorámica y plan.',
      services: ['svc_odo_consulta', 'svc_odo_rx_panoramica', 'svc_odo_plan'].map(
        (serviceId) => ({ serviceId }),
      ),
    },
    {
      id: 'pack_odonto_limpieza',
      name: 'Odontología — limpieza',
      description: 'Consulta con profilaxis dental.',
      services: ['svc_odo_consulta', 'svc_odo_profilaxis'].map((serviceId) => ({ serviceId })),
    },
    {
      id: 'pack_odonto_endodoncia',
      name: 'Odontología — endodoncia',
      description: 'Tratamiento de conducto unirradicular con reconstrucción.',
      services: ['svc_odo_rx_periapical', 'svc_odo_endo_uni', 'svc_odo_perno'].map(
        (serviceId) => ({ serviceId }),
      ),
    },
    {
      id: 'pack_odonto_ortodoncia',
      name: 'Odontología — ortodoncia inicial',
      description: 'Estudio, instalación de brackets y primer control.',
      services: ['svc_odo_orto_estudio', 'svc_odo_orto_metal', 'svc_odo_orto_control'].map(
        (serviceId) => ({ serviceId }),
      ),
    },
    {
      id: 'pack_trau_consulta',
      name: 'Traumatología — consulta y yeso',
      description: 'Consulta, radiografía e inmovilización.',
      services: ['svc_trau_consulta', 'svc_rayosx', 'svc_trau_yeso_mi'].map((serviceId) => ({
        serviceId,
      })),
    },
    {
      id: 'pack_gine_prenatal',
      name: 'Ginecología — primer control prenatal',
      description: 'Consulta, ecografía y laboratorio del primer control.',
      services: [
        'svc_gine_prenatal',
        'svc_gine_eco_obstetrica',
        'svc_hematologia',
        'svc_perfil20',
        'svc_prueba_rapida',
      ].map((serviceId) => ({ serviceId })),
    },
    {
      id: 'pack_ped_chequeo',
      name: 'Pediatría — niño sano',
      description: 'Control de niño sano con constancia y laboratorio básico.',
      services: ['svc_ped_nino_sano', 'svc_ped_constancia', 'svc_hematologia'].map(
        (serviceId) => ({ serviceId }),
      ),
    },
    {
      id: 'pack_derma_consulta',
      name: 'Dermatología — consulta y dermatoscopia',
      description: 'Consulta dermatológica con estudio de lunares.',
      services: ['svc_derma_consulta', 'svc_derma_dermatoscopia'].map((serviceId) => ({
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
 *  2. Etiqueta con su área los servicios conocidos que aún no la tengan.
 *  3. Mueve los servicios reorganizados si siguen en la categoría antigua.
 *  4. Reordena las categorías añadiendo las nuevas y limpia la antigua si vacía.
 *  5. Añade las áreas y plantillas nuevas que falten.
 */
export function migrateCatalogDefaults(
  catalog: Catalog,
  options: { seedProducts?: boolean } = {},
): Catalog {
  const existing = new Set(catalog.services.map((service) => service.id))

  const services = [...catalog.services]
  for (const service of DEFAULT_SERVICES) {
    if (!existing.has(service.id)) services.push(structuredClone(service))
  }

  const relocated = services.map((service) => {
    const nextCategory = MOVED_CATEGORY[service.id]
    const specialtyId = service.specialtyId ?? DEFAULT_SPECIALTY_BY_SERVICE[service.id]
    const withCategory =
      nextCategory && service.category === LEGACY_CATEGORY
        ? { ...service, category: nextCategory }
        : service
    return specialtyId === service.specialtyId
      ? withCategory
      : { ...withCategory, specialtyId }
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

  const known = new Set(catalog.specialties.map((specialty) => specialty.id))
  const specialties = [
    ...catalog.specialties,
    ...DEFAULT_SPECIALTIES.filter((specialty) => !known.has(specialty.id)).map(
      (specialty) => ({ ...specialty }),
    ),
  ]

  // Los catálogos anteriores a las cotizaciones no traían productos. En ese
  // caso se siembra el catálogo de ejemplo. Si el catálogo ya viene con la
  // lista (aunque esté vacía porque el usuario borró todo), se respeta tal cual.
  const products =
    options.seedProducts !== false &&
    catalog.products.length === 0
      ? structuredClone(DEFAULT_PRODUCTS)
      : catalog.products

  return { categories, services: relocated, packs, specialties, products }
}
