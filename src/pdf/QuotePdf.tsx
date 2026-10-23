import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { QuoteCalcResult } from '@/lib/quoteCalc'
import { buildQuoteDocumentModel } from '@/lib/quoteDocument'
import type { Clinic, PageSize, Quote } from '@/types'

const SKY = '#0284c7'
const SKY_DARK = '#0369a1'
const SLATE_100 = '#f1f5f9'
const SLATE_50 = '#f8fafc'
const LINE = '#e2e8f0'
const SLATE_800 = '#1e293b'
const SLATE_700 = '#334155'
const SLATE_600 = '#475569'
const SLATE_500 = '#64748b'

const PDF_SIZE = {
  A4: 'A4',
  Letter: 'LETTER',
  Legal: 'LEGAL',
} as const

/**
 * Cabecera fija de todas las hojas. Deja espacio arriba para que el contenido
 * empiece siempre por debajo, incluso en las páginas de continuación.
 */
const HEADER_SPACE = 190

const styles = StyleSheet.create({
  page: {
    paddingTop: HEADER_SPACE,
    paddingBottom: 54,
    paddingHorizontal: 32,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: SLATE_600,
  },

  pageHeader: {
    position: 'absolute',
    top: 16,
    left: 32,
    right: 32,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: SKY,
    paddingBottom: 4,
  },
  companyLeft: { flexDirection: 'row', alignItems: 'center', maxWidth: '62%' },
  logo: { width: 32, height: 32, marginRight: 8 },
  clinicName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: SLATE_800 },
  clinicLine: { fontSize: 7.4, color: SLATE_600, marginTop: 1 },
  companyRight: { textAlign: 'right', maxWidth: '36%' },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: SKY_DARK },
  docMeta: { fontSize: 7.6, color: SLATE_600, marginTop: 1 },
  docMetaStrong: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  continuationRow: {
    marginTop: 4,
    paddingTop: 3,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    flexDirection: 'row',
    gap: 18,
  },
  continuationCol: { flex: 1 },
  continuationText: { fontSize: 7.2, lineHeight: 1.35, color: SLATE_600 },
  continuationStrong: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  metaCol: { flex: 1 },
  metaLine: { fontSize: 8, lineHeight: 1.35, color: SLATE_600, marginBottom: 1 },
  metaStrong: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },
  metaMuted: { color: SLATE_500 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SLATE_100,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: LINE,
    paddingVertical: 3.5,
    paddingHorizontal: 4,
  },
  repeatedTableHeader: {
    position: 'absolute',
    top: 174,
    left: 32,
    right: 32,
  },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 7.3, color: SLATE_800 },

  colCode: { flex: 0.8 },
  colDescription: { flex: 3.15 },
  colQty: { flex: 0.62, textAlign: 'right' },
  colUnit: { flex: 0.62, textAlign: 'center' },
  colPrice: { flex: 0.95, textAlign: 'right' },
  colTaxRate: { flex: 0.62, textAlign: 'right' },
  colTax: { flex: 0.9, textAlign: 'right' },
  colNet: { flex: 1, textAlign: 'right' },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_100,
    paddingVertical: 3.2,
    paddingHorizontal: 4,
  },
  // Con dos monedas cada importe ocupa dos líneas: se aprieta un poco el
  // renglón para que una cotización larga siga cabiendo en dos hojas Carta.
  rowBoth: { paddingVertical: 2 },
  cell: { fontSize: 7.7, lineHeight: 1.25 },
  cellOther: { fontSize: 6.4, lineHeight: 1.05, color: SLATE_500 },
  amountCol: { flexDirection: 'column', alignItems: 'flex-end' },
  cellStrong: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  empty: { paddingVertical: 22, textAlign: 'center', color: SLATE_500, fontSize: 8.5 },

  closing: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 20,
  },
  rateBox: {
    flex: 1,
    backgroundColor: SLATE_50,
    borderLeftWidth: 3,
    borderLeftColor: SKY,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  rateLine: { fontSize: 7.8, color: SLATE_600, marginBottom: 2 },
  rateStrong: { fontFamily: 'Helvetica-Bold', color: SLATE_800 },

  totalsBox: { width: 190 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    backgroundColor: SLATE_50,
  },
  totalsLabel: { fontSize: 8.5, color: SLATE_700 },
  totalsValues: { flexDirection: 'column', alignItems: 'flex-end' },
  totalsValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: SLATE_800 },
  totalsValueOther: { fontSize: 7, color: SLATE_500 },
  totalsFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: SKY_DARK,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
  },
  totalsFinalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  totalsFinalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  totalsFinalValueOther: { fontSize: 7.2, color: '#e0f2fe' },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: SLATE_500 },
})

interface QuotePdfProps {
  quote: Quote
  calc: QuoteCalcResult
  clinic: Clinic
  pageSize: PageSize
}

function TableHeader({ priceColumnLabel }: { priceColumnLabel: string }) {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.thText, styles.colCode]}>Código</Text>
      <Text style={[styles.thText, styles.colDescription]}>Descripción</Text>
      <Text style={[styles.thText, styles.colQty]}>Cant.</Text>
      <Text style={[styles.thText, styles.colUnit]}>Unidad</Text>
      <Text style={[styles.thText, styles.colPrice]}>{priceColumnLabel}</Text>
      <Text style={[styles.thText, styles.colTaxRate]}>% IVA</Text>
      <Text style={[styles.thText, styles.colTax]}>IVA</Text>
      <Text style={[styles.thText, styles.colNet]}>Neto</Text>
    </View>
  )
}

export function QuotePdf({ quote, calc, clinic, pageSize }: QuotePdfProps) {
  const model = buildQuoteDocumentModel(quote, calc, clinic, pageSize)
  const contact = [clinic.address, clinic.phone].filter(Boolean).join(' | ')

  const continuationInfo = (
    <>
      <View style={styles.continuationCol}>
        <Text style={styles.continuationText}>
          <Text style={styles.continuationStrong}>Cliente: </Text>
          {model.client.name}
          {model.client.code ? ` · Código: ${model.client.code}` : ''}
          {model.client.rif ? ` · RIF: ${model.client.rif}` : ''}
        </Text>
        {model.client.phones ? (
          <Text style={styles.continuationText}>
            <Text style={styles.continuationStrong}>Teléfonos: </Text>
            {model.client.phones}
          </Text>
        ) : null}
        {model.client.address ? (
          <Text style={styles.continuationText}>
            <Text style={styles.continuationStrong}>Dirección: </Text>
            {model.client.address}
          </Text>
        ) : null}
      </View>
      <View style={styles.continuationCol}>
        {model.seller ? (
          <Text style={styles.continuationText}>
            <Text style={styles.continuationStrong}>Vendedor: </Text>
            {model.seller}
          </Text>
        ) : null}
        {model.office || model.transport ? (
          <Text style={styles.continuationText}>
            {model.office ? `Oficina: ${model.office}` : ''}
            {model.office && model.transport ? ' · ' : ''}
            {model.transport ? `Transporte: ${model.transport}` : ''}
          </Text>
        ) : null}
        <Text style={styles.continuationText}>
          <Text style={styles.continuationStrong}>Tasa: </Text>
          {model.rateLabel}
          {model.dueDate ? ` · Vence: ${model.dueDate}` : ''}
        </Text>
        {model.purchaseOrder ? (
          <Text style={styles.continuationText}>
            <Text style={styles.continuationStrong}>Orden de compra: </Text>
            {model.purchaseOrder}
          </Text>
        ) : null}
        {model.description ? (
          <Text style={styles.continuationText}>
            <Text style={styles.continuationStrong}>Descripción: </Text>
            {model.description}
          </Text>
        ) : null}
      </View>
    </>
  )

  const firstPageInfo = (
    <>
      <View style={styles.metaCol}>
        <Text style={styles.metaLine}>
          <Text style={styles.metaMuted}>Cliente: </Text>
          <Text style={styles.metaStrong}>{model.client.name}</Text>
        </Text>
        {model.client.code ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Código: </Text>
            {model.client.code}
          </Text>
        ) : null}
        {model.client.rif ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>RIF: </Text>
            {model.client.rif}
          </Text>
        ) : null}
        {model.client.phones ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Teléfonos: </Text>
            {model.client.phones}
          </Text>
        ) : null}
        {model.client.address ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Dirección: </Text>
            {model.client.address}
          </Text>
        ) : null}
      </View>

      <View style={styles.metaCol}>
        {model.seller ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Vendedor: </Text>
            {model.seller}
          </Text>
        ) : null}
        {model.office ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Oficina: </Text>
            {model.office}
          </Text>
        ) : null}
        {model.transport ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Transporte: </Text>
            {model.transport}
          </Text>
        ) : null}
        {model.dueDate ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Vence: </Text>
            {model.dueDate}
          </Text>
        ) : null}
        {model.purchaseOrder ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Orden de compra: </Text>
            {model.purchaseOrder}
          </Text>
        ) : null}
        {model.description ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaMuted}>Descripción: </Text>
            {model.description}
          </Text>
        ) : null}
      </View>
    </>
  )

  return (
    <Document
      title={`Cotización ${model.number}${quote.client.name ? ` — ${quote.client.name}` : ''}`}
      author={clinic.name}
      subject="Cotización de productos"
      creator="Budgetify"
      producer="Budgetify"
      language="es"
    >
      <Page size={PDF_SIZE[pageSize]} style={styles.page}>
        {/* Cabecera fija: se repite en todas las hojas. En las continuaciones
            añade una línea compacta con los datos del cliente y del documento. */}
        <View style={styles.pageHeader} fixed>
          <View style={styles.companyRow}>
            <View style={styles.companyLeft}>
              {clinic.logoDataUrl ? <Image style={styles.logo} src={clinic.logoDataUrl} /> : null}
              <View>
                <Text style={styles.clinicName}>{clinic.name || 'Empresa'}</Text>
                {clinic.rif ? <Text style={styles.clinicLine}>RIF: {clinic.rif}</Text> : null}
                {contact ? <Text style={styles.clinicLine}>{contact}</Text> : null}
              </View>
            </View>
            <View style={styles.companyRight}>
              <Text style={styles.docTitle}>COTIZACIÓN</Text>
              <Text style={styles.docMeta}>
                <Text style={styles.docMetaStrong}>N.º {model.number}</Text>
              </Text>
              <Text style={styles.docMeta}>Emisión: {model.issueDate}</Text>
              <Text style={styles.docMeta}>Moneda: {model.currencyDisplay}</Text>
            </View>
          </View>

          <View
            style={styles.continuationRow}
            render={({ pageNumber }) =>
              pageNumber === 1 ? firstPageInfo : continuationInfo
            }
          />
        </View>

        {/* Cabecera de tabla de las páginas 2 en adelante. En la primera hoja
            se pinta en el flujo, justo debajo de la cabecera fija. */}
        <View
          style={styles.repeatedTableHeader}
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <TableHeader priceColumnLabel={model.priceColumnLabel} />
            ) : null
          }
        />

        <TableHeader priceColumnLabel={model.priceColumnLabel} />

        {model.rows.length === 0 ? (
          <Text style={styles.empty}>Aún no hay productos en la cotización.</Text>
        ) : (
          model.rows.map((row) => (
            <View
              key={row.id}
              style={[styles.row, model.showBothCurrencies ? styles.rowBoth : undefined]}
              wrap={false}
            >
              <Text style={[styles.cell, styles.colCode]}>{row.code}</Text>
              <Text style={[styles.cell, styles.colDescription]}>{row.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>{row.qty}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{row.unit}</Text>
              <View style={[styles.colPrice, styles.amountCol]}>
                <Text style={styles.cell}>{row.unitPrice}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.cellOther}>{row.unitPriceOther}</Text>
                )}
              </View>
              <Text style={[styles.cell, styles.colTaxRate]}>{row.taxRate}</Text>
              <View style={[styles.colTax, styles.amountCol]}>
                <Text style={styles.cell}>{row.tax}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.cellOther}>{row.taxOther}</Text>
                )}
              </View>
              <View style={[styles.colNet, styles.amountCol]}>
                <Text style={[styles.cell, styles.cellStrong]}>{row.net}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.cellOther}>{row.netOther}</Text>
                )}
              </View>
            </View>
          ))
        )}

        <View style={styles.closing} wrap={false}>
          <View style={styles.rateBox}>
            <Text style={styles.rateLine}>
              <Text style={styles.rateStrong}>Tasa de cálculo: </Text>
              {model.rateLabel}
            </Text>
            {model.showBothCurrencies && (
              <Text style={styles.rateLine}>
                <Text style={styles.rateStrong}>{model.totalOtherLabel}: </Text>
                {model.totalOther}
              </Text>
            )}
            <Text style={styles.rateLine}>
              <Text style={styles.rateStrong}>Moneda: </Text>
              {model.currencyDisplay}
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sub-Total</Text>
              <View style={styles.totalsValues}>
                <Text style={styles.totalsValue}>{model.subtotal}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.totalsValueOther}>{model.subtotalOther}</Text>
                )}
              </View>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA</Text>
              <View style={styles.totalsValues}>
                <Text style={styles.totalsValue}>{model.taxTotal}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.totalsValueOther}>{model.taxTotalOther}</Text>
                )}
              </View>
            </View>
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>Neto</Text>
              <View style={styles.totalsValues}>
                <Text style={styles.totalsFinalValue}>{model.total}</Text>
                {model.showBothCurrencies && (
                  <Text style={styles.totalsFinalValueOther}>{model.totalOther}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Cotización N.º {model.number} · {model.footerNote}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
