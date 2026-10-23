import { Fragment, type CSSProperties } from 'react'
import { PAGE_DIMENSIONS, type DocumentModel } from '@/lib/document'

/**
 * Plantilla de columnas del documento. En móvil las filas se apilan (una
 * columna) y a partir de `sm` se alinean las cuatro columnas del papel.
 */
const COLS = 'sm:grid-cols-[30%_34%_16%_20%]'

interface DocumentPreviewProps {
  model: DocumentModel
}

/** Hoja que reproduce el PDF, en vivo y sin cargar react-pdf. */
export function DocumentPreview({ model }: DocumentPreviewProps) {
  const { clinic, patient } = model
  const page = PAGE_DIMENSIONS[model.pageSize]
  const contact = [clinic.address, clinic.phone].filter(Boolean).join(' | ')

  return (
    <div className="overflow-x-auto">
      <article
        data-testid="document-preview"
        aria-label="Vista previa del presupuesto"
        style={{ '--doc-ratio': `${page.width} / ${page.height}` } as CSSProperties}
        className="mx-auto w-full max-w-[800px] rounded-md border border-slate-200 bg-white px-4 py-6 text-[11px] text-slate-600 shadow-sm sm:px-9 sm:py-8 sm:[aspect-ratio:var(--doc-ratio)]"
      >
        {/* Encabezado */}
        <header className="flex flex-col gap-3 border-b-2 border-sky-600 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {clinic.logoDataUrl && (
              <img
                src={clinic.logoDataUrl}
                alt={`Logo de ${clinic.name || 'la clínica'}`}
                className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
              />
            )}
            <div className="min-w-0">
              <p className="text-base font-bold break-words text-slate-800 uppercase">
                {model.headerTitle}
              </p>
              {model.headerSubtitle && (
                <p className="text-[11px] break-words font-semibold text-sky-700">
                  {model.headerSubtitle}
                </p>
              )}
              {clinic.rif && (
                <p className="text-[11px] break-words text-slate-600">RIF:{clinic.rif}</p>
              )}
              {contact && (
                <p className="text-[11px] break-words text-slate-600">{contact}</p>
              )}
            </div>
          </div>
          <div className="text-[11px] sm:shrink-0 sm:text-right sm:whitespace-nowrap">
            <span className="text-slate-500">Fecha de Emisión: </span>
            <span className="font-bold text-slate-800">{model.issueDate}</span>
          </div>
        </header>

        {/* Procedimiento / paciente / tasa */}
        <div className="flex flex-col gap-2 border-b border-slate-200 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="grid gap-1">
            {model.procedure && (
              <p className="break-words">
                <span className="text-slate-500">Procedimiento: </span>
                <span className="font-semibold text-slate-800">{model.procedure}</span>
              </p>
            )}
            <p className="break-words">
              <span className="text-slate-500">Paciente: </span>
              <span className="font-medium text-slate-800">{patient.name || '—'}</span>
              {patient.ci && (
                <>
                  <span className="text-slate-500"> CI: </span>
                  <span className="text-slate-800">{patient.ci}</span>
                </>
              )}
              {patient.age ? (
                <>
                  <span className="text-slate-500"> Edad: </span>
                  <span className="text-slate-800">{patient.age} Años</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] sm:shrink-0 sm:whitespace-nowrap">
            <span className="text-amber-800">Precio del dólar: </span>
            <span className="font-bold text-amber-800">{model.rateLabel}</span>
          </div>
        </div>

        {/* Tabla */}
        {model.sections.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-slate-300 py-10 text-center text-xs text-slate-500">
            Aún no hay servicios en el presupuesto.
          </p>
        ) : (
          <div className="mt-3">
            <div
              className={`hidden border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-800 sm:grid ${COLS}`}
            >
              <span>Concepto / Servicio</span>
              <span>Detalle de Cálculo</span>
              <span className="text-right">Monto (USD)</span>
              <span className="text-right">Monto (VES)</span>
            </div>

            {model.sections.map((section) => (
              <Fragment key={section.title}>
                <div className="bg-sky-100 px-2 py-1.5 text-[11px] font-bold text-sky-700">
                  {section.index}. {section.title}
                </div>

                {section.rows.map((row) => (
                  <div
                    key={row.id}
                    className={`grid gap-x-3 gap-y-0.5 border-b border-slate-100 px-2 py-2 sm:items-start sm:gap-0 sm:py-1.5 ${COLS}`}
                  >
                    <span className="font-medium text-slate-700">{row.concept}</span>
                    <span className="text-slate-600">{row.detail}</span>
                    <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                      <span className="text-slate-500 sm:hidden">USD</span>
                      <span>{row.amountUsd}</span>
                    </span>
                    <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right">
                      <span className="text-slate-500 sm:hidden">VES</span>
                      <span>{row.amountVes}</span>
                    </span>
                  </div>
                ))}

                <div
                  className={`grid gap-x-3 gap-y-0.5 border-b border-slate-200 bg-slate-50 px-2 py-2 sm:gap-0 sm:py-1.5 ${COLS}`}
                >
                  <span className="text-[10px] text-slate-500 sm:col-span-2 sm:text-right sm:text-[11px] sm:font-semibold sm:text-slate-700">
                    {section.subtotalLabel}
                  </span>
                  <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right sm:font-bold">
                    <span className="text-slate-500 sm:hidden">USD</span>
                    <span>{section.subtotalUsd}</span>
                  </span>
                  <span className="flex justify-between gap-2 tabular-nums sm:block sm:text-right sm:font-bold">
                    <span className="text-slate-500 sm:hidden">VES</span>
                    <span>{section.subtotalVes}</span>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="mt-3 flex flex-col gap-1.5 bg-sky-700 px-3 py-2 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-[13px] font-bold">TOTAL GENERAL ESTIMADO:</span>
          <span className="flex flex-wrap gap-x-6 gap-y-0.5 tabular-nums sm:whitespace-nowrap">
            <span className="font-bold">{model.totalUsd}</span>
            <span className="font-bold">{model.totalVes}</span>
          </span>
        </div>

        {/* Notas */}
        {model.notes.length > 0 && (
          <section className="mt-4 border-l-4 border-sky-600 bg-slate-50 p-3">
            <h3 className="mb-2 text-[12px] font-bold text-slate-800">
              Notas y Recomendaciones Importantes
            </h3>
            <ul className="grid gap-2">
              {model.notes.map((note, index) => (
                <li key={index} className="flex gap-2 text-[10.5px] text-slate-600">
                  <span aria-hidden="true" className="text-slate-500">•</span>
                  <span>
                    {note.label && <b className="text-slate-800">{note.label}: </b>}
                    {note.body}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Firmas */}
        {model.signatures.length > 0 && (
          <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {model.signatures.map((signature) => (
              <div key={signature.label} className="grid content-start gap-1">
                <div className="grid h-16 place-items-center">
                  {signature.imageDataUrl && (
                    <img
                      src={signature.imageDataUrl}
                      alt={signature.label}
                      className="max-h-16 object-contain"
                    />
                  )}
                </div>
                <div className="border-t border-slate-400 pt-1 text-center">
                  <p className="text-[10px] font-semibold text-slate-700">
                    {signature.label}
                  </p>
                  {signature.name && (
                    <p className="text-[10px] break-words text-slate-500">
                      {signature.name}
                    </p>
                  )}
                  {signature.extra && (
                    <p className="text-[10px] break-words text-slate-500">
                      {signature.extra}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Pie */}
        <div className="mt-6 flex flex-col gap-1 text-[9px] text-slate-500 sm:flex-row sm:justify-between">
          <span>{model.footerNote}</span>
          <span>Página 1</span>
        </div>
      </article>
    </div>
  )
}
