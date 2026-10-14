import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CalcResult } from '@/lib/calc'
import { buildDocumentModel } from '@/lib/document'
import type { Budget, Clinic, PageSize, RateMode } from '@/types'

const SKY = '#0284c7'
const SKY_DARK = '#0369a1'
const SKY_LIGHT = '#e0f2fe'
const SLATE_100 = '#f1f5f9'
const SLATE_50 = '#f8fafc'
const LINE = '#e2e8f0'
const SLATE_800 = '#1e293b'
const SLATE_700 = '#334155'
const SLATE_600 = '#475569'
const SLATE_500 = '#64748b'
const AMBER_BG = '#fef3c7'
const AMBER_TEXT = '#92400e'

const PDF_SIZE = {
  A4: 'A4',
  Letter: 'LETTER',
  Legal: 'LEGAL',
} as const

const styles = StyleSheet.create({
  page: {
    paddingVertical: 34,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: SLATE_600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: SKY,
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', maxWidth: '68%' },
  logo: { width: 56, height: 56, marginRight: 12 },
  clinicName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: SLATE_800 },
  clinicLine: { fontSize: 8.5, color: SLATE_600, marginTop: 1.5 },
  headerRight: { textAlign: 'right' },
  muted: { color: SLATE_500 },
  bold: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 7,
  },
  row2Left: { maxWidth: '66%' },
  line: { marginBottom: 2.5 },
  rateBox: {
    backgroundColor: AMBER_BG,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rateText: { fontSize: 9, color: AMBER_TEXT },
  rateBold: { fontFamily: 'Helvetica-Bold', color: AMBER_TEXT },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SLATE_100,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: SLATE_800 },
  colConcept: { flex: 3 },
  colDetail: { flex: 3.4 },
  colUsd: { flex: 1.6, textAlign: 'right' },
  colVes: { flex: 2, textAlign: 'right' },

  categoryRow: {
    flexDirection: 'row',
    backgroundColor: SKY_LIGHT,
    paddingVertical: 5.5,
    paddingHorizontal: 6,
  },
  categoryText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: SKY_DARK },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingVertical: 6.5,
    paddingHorizontal: 6,
  },
  cell: { fontSize: 9 },
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  subtotalLabel: {
    flex: 6.4,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: SLATE_700,
  },
  amountBold: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SKY,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  totalLabel: {
    flex: 6.4,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'right',
  },
  totalAmount: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    fontSize: 11,
  },

  empty: { paddingVertical: 24, textAlign: 'center', color: SLATE_500, fontSize: 9 },

  notes: {
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: SKY,
    backgroundColor: SLATE_50,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  notesTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_800,
    marginBottom: 5,
  },
  note: { fontSize: 8.5, marginBottom: 4, lineHeight: 1.45, color: SLATE_600 },
  noteLabel: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  signatures: { flexDirection: 'row', marginTop: 34 },
  signatureCol: { flex: 1, paddingHorizontal: 20 },
  signatureImageBox: { height: 46, alignItems: 'center', justifyContent: 'flex-end' },
  signatureImage: { maxHeight: 44, maxWidth: 130, objectFit: 'contain' },
  signatureLine: { borderTopWidth: 1, borderTopColor: SLATE_500, paddingTop: 3 },
  signatureLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_700,
    textAlign: 'center',
  },
  signatureDetail: { fontSize: 8, color: SLATE_500, textAlign: 'center', marginTop: 1 },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: SLATE_500 },
})

interface BudgetPdfProps {
  budget: Budget
  calc: CalcResult
  clinic: Clinic
  rateMode: RateMode
  pageSize: PageSize
}

export function BudgetPdf({ budget, calc, clinic, rateMode, pageSize }: BudgetPdfProps) {
  const model = buildDocumentModel(budget, calc, clinic, { rateMode, pageSize })
  const contact = [clinic.address, clinic.phone].filter(Boolean).join(' | ')

  return (
    <Document
      title={`Presupuesto médico${budget.patient.name ? ` — ${budget.patient.name}` : ''}`}
      author={clinic.name || 'Budgetify'}
    >
      <Page size={PDF_SIZE[pageSize]} style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {clinic.logoDataUrl && <Image style={styles.logo} src={clinic.logoDataUrl} />}
            <View>
              <Text style={styles.clinicName}>{clinic.name || 'Clínica'}</Text>
              {clinic.rif ? <Text style={styles.clinicLine}>RIF:{clinic.rif}</Text> : null}
              {contact ? <Text style={styles.clinicLine}>{contact}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.cell}>
              <Text style={styles.muted}>Fecha de Emisión: </Text>
              <Text style={styles.bold}>{model.issueDate}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.row2}>
          <View style={styles.row2Left}>
            {model.procedure ? (
              <Text style={styles.line}>
                <Text style={styles.muted}>Procedimiento: </Text>
                <Text style={styles.bold}>{model.procedure}</Text>
              </Text>
            ) : null}
            <Text style={styles.line}>
              <Text style={styles.muted}>Paciente: </Text>
              <Text style={styles.bold}>{model.patient.name || '—'}</Text>
              {model.patient.ci ? (
                <Text>
                  <Text style={styles.muted}> CI: </Text>
                  {model.patient.ci}
                </Text>
              ) : null}
              {model.patient.age ? (
                <Text>
                  <Text style={styles.muted}> Edad: </Text>
                  {`${model.patient.age} Años`}
                </Text>
              ) : null}
            </Text>
          </View>
          <View style={styles.rateBox}>
            <Text style={styles.rateText}>
              <Text style={styles.muted}>Tasa de Cálculo: </Text>
              <Text style={styles.rateBold}>{model.rateLabel}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader} fixed>
          <Text style={[styles.thText, styles.colConcept]}>Concepto / Servicio</Text>
          <Text style={[styles.thText, styles.colDetail]}>Detalle de Cálculo</Text>
          <Text style={[styles.thText, styles.colUsd]}>Monto (USD)</Text>
          <Text style={[styles.thText, styles.colVes]}>Monto (VES)</Text>
        </View>

        {model.sections.length === 0 ? (
          <Text style={styles.empty}>Aún no hay servicios en el presupuesto.</Text>
        ) : (
          model.sections.map((section) => (
            <View key={section.title}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryText}>
                  {section.index}. {section.title}
                </Text>
              </View>

              {section.rows.map((row) => (
                <View key={row.id} style={styles.row} wrap={false}>
                  <Text style={[styles.cell, styles.colConcept]}>{row.concept}</Text>
                  <Text style={[styles.cell, styles.colDetail]}>{row.detail}</Text>
                  <Text style={[styles.cell, styles.colUsd]}>{row.amountUsd}</Text>
                  <Text style={[styles.cell, styles.colVes]}>{row.amountVes}</Text>
                </View>
              ))}

              <View style={styles.subtotalRow} wrap={false}>
                <Text style={styles.subtotalLabel}>{section.subtotalLabel}</Text>
                <Text style={[styles.colUsd, styles.amountBold]}>{section.subtotalUsd}</Text>
                <Text style={[styles.colVes, styles.amountBold]}>{section.subtotalVes}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.totalBar} wrap={false}>
          <Text style={styles.totalLabel}>TOTAL GENERAL ESTIMADO:</Text>
          <Text style={[styles.totalAmount, styles.colUsd]}>{model.totalUsd}</Text>
          <Text style={[styles.totalAmount, styles.colVes]}>{model.totalVes}</Text>
        </View>

        {model.notes.length > 0 && (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>Notas y Recomendaciones Importantes</Text>
            {model.notes.map((note, index) => (
              <Text key={index} style={styles.note}>
                • {note.label ? <Text style={styles.noteLabel}>{note.label}: </Text> : null}
                {note.body}
              </Text>
            ))}
          </View>
        )}

        {model.signatures.length > 0 && (
          <View style={styles.signatures} wrap={false}>
            {model.signatures.map((signature) => (
              <View key={signature.label} style={styles.signatureCol}>
                <View style={styles.signatureImageBox}>
                  {signature.imageDataUrl ? (
                    <Image style={styles.signatureImage} src={signature.imageDataUrl} />
                  ) : null}
                </View>
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureLabel}>{signature.label}</Text>
                  {signature.name ? (
                    <Text style={styles.signatureDetail}>{signature.name}</Text>
                  ) : null}
                  {signature.extra ? (
                    <Text style={styles.signatureDetail}>{signature.extra}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{model.footerNote}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber }) => `Página ${pageNumber}`}
          />
        </View>
      </Page>
    </Document>
  )
}
