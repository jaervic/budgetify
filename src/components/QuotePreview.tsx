import type { CSSProperties } from 'react'
import { PAGE_DIMENSIONS } from '@/lib/document'
import type { QuoteDocumentModel } from '@/lib/quoteDocument'

const COLS =
  'sm:grid-cols-[5rem_minmax(0,2fr)_3rem_3rem_5rem_3.75rem_5rem_5.5rem]'

interface QuotePreviewProps {
  model: QuoteDocumentModel
}

function MetaLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <p className="break-words">
      <span className="text-slate-500">{label}: </span>
      <span className="text-slate-700">{value}</span>
    </p>
  )
}

/** Hoja de cotización que reproduce el PDF, en vivo y sin cargar react-pdf. */
export function QuotePreview({ model }: QuotePreviewProps) {
  const { clinic, client } = model
  const page = PAGE_DIMENSIONS[model.pageSize]
  const contact = [clinic.address, clinic.phone].filter(Boolean).join(' | ')

  return (
    <div className="overflow-x-auto">
      <article
        data-testid="quote-preview"
        aria-label="Vista previa de la cotización"
        style={{ '--doc-ratio': `${page.width} / ${page.height}` } as CSSProperties}
        className="mx-auto w-full max-w-[800px] rounded-md border border-slate-200 bg-white px-4 py-6 text-[10.5px] text-slate-600 shadow-sm sm:px-8 sm:py-7 sm:[aspect-ratio:var(--doc-ratio)]"
      >
        <header className="flex flex-col gap-2 border-b-2 border-sky-600 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            {clinic.logoDataUrl && (
              <img
                src={clinic.logoDataUrl}
                alt={`Logo de ${clinic.name || 'la empresa'}`}
                className="h-11 w-11 shrink-0 object-contain"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold break-words text-slate-800 uppercase">
                {clinic.name || 'Empresa'}
              </p>
              {clinic.rif && (
                <p className="text-[10px] break-words text-slate-600">RIF: {clinic.rif}</p>
              )}
              {contact && <p className="text-[10px] break-words text-slate-600">{contact}</p>}
            </div>
          </div>
          <div className="text-[10px] sm:shrink-0 sm:text-right sm:whitespace-nowrap">
            <p className="text-sm font-bold text-sky-700">COTIZACIÓN</p>
            <p>
              <span className="text-slate-500">N.º: </span>
              <span className="font-semibold text-slate-800">{model.number}</span>
            </p>
            <p>
              <span className="text-slate-500">Emisión: </span>
              <span className="text-slate-800">{model.issueDate}</span>
            </p>
            <p>
              <span className="text-slate-500">Moneda: </span>
              <span className="text-slate-800">{model.currency}</span>
            </p>
          </div>
        </header>

        <div className="grid gap-3 border-b border-slate-200 py-2 sm:grid-cols-2">
          <div className="grid gap-0.5">
            <MetaLine label="Cliente" value={client.name} />
            <MetaLine label="Código" value={client.code} />
            <MetaLine label="RIF" value={client.rif} />
            <MetaLine label="Teléfonos" value={client.phones} />
            <MetaLine label="Dirección" value={client.address} />
          </div>
          <div className="grid gap-0.5">
            <MetaLine label="Vendedor" value={model.seller} />
            <MetaLine label="Oficina" value={model.office} />
            <MetaLine label="Transporte" value={model.transport} />
            <MetaLine label="Vence" value={model.dueDate} />
            <MetaLine label="Orden de compra" value={model.purchaseOrder} />
            <MetaLine label="Descripción" value={model.description} />
          </div>
        </div>

        {model.rows.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-slate-300 py-10 text-center text-xs text-slate-500">
            Aún no hay productos en la cotización.
          </p>
        ) : (
          <div className="mt-2">
            <div
              className={`hidden border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-[10px] font-semibold text-slate-800 sm:grid ${COLS}`}
            >
              <span>Código</span>
              <span>Descripción</span>
              <span className="text-right">Cant.</span>
              <span className="text-center">Unidad</span>
              <span className="text-right">{model.priceColumnLabel}</span>
              <span className="text-right">% IVA</span>
              <span className="text-right">IVA</span>
              <span className="text-right">Neto</span>
            </div>

            {model.rows.map((row) => (
              <div
                key={row.id}
                className={`grid gap-x-2 gap-y-0.5 border-b border-slate-100 px-2 py-1.5 sm:items-start sm:gap-0 ${COLS}`}
              >
                <span className="font-medium text-slate-700">{row.code}</span>
                <span className="break-words text-slate-700">{row.description}</span>
                <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                  <span className="text-slate-500 sm:hidden">Cant.</span>
                  <span>{row.qty}</span>
                </span>
                <span className="flex justify-between gap-2 sm:block sm:text-center">
                  <span className="text-slate-500 sm:hidden">Unidad</span>
                  <span>{row.unit}</span>
                </span>
                <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                  <span className="text-slate-500 sm:hidden">Precio</span>
                  <span>{row.unitPrice}</span>
                </span>
                <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                  <span className="text-slate-500 sm:hidden">% IVA</span>
                  <span>{row.taxRate}</span>
                </span>
                <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                  <span className="text-slate-500 sm:hidden">IVA</span>
                  <span>{row.tax}</span>
                </span>
                <span className="flex justify-between gap-2 font-medium tabular-nums sm:block sm:text-right">
                  <span className="font-normal text-slate-500 sm:hidden">Neto</span>
                  <span>{row.net}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-fit rounded-md border-l-4 border-sky-600 bg-slate-50 px-3 py-1.5 text-[10px]">
            <p>
              <span className="font-semibold text-slate-800">Tasa: </span>
              {model.rateLabel}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{model.totalOtherLabel}: </span>
              {model.totalOther}
            </p>
          </div>

          <div className="grid w-full gap-0 text-[11px] sm:w-52">
            <div className="flex justify-between border-b border-slate-200 bg-slate-50 px-2 py-1">
              <span className="text-slate-600">Sub-Total</span>
              <span className="font-semibold text-slate-800">{model.subtotal}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 bg-slate-50 px-2 py-1">
              <span className="text-slate-600">IVA</span>
              <span className="font-semibold text-slate-800">{model.taxTotal}</span>
            </div>
            <div className="flex justify-between bg-sky-700 px-2 py-1.5 text-white">
              <span className="font-bold">Neto</span>
              <span className="font-bold">{model.total}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1 border-t border-slate-200 pt-2 text-[8.5px] text-slate-500 sm:flex-row sm:justify-between">
          <span>
            Cotización N.º {model.number} · {model.footerNote}
          </span>
          <span>Página 1</span>
        </div>
      </article>
    </div>
  )
}
