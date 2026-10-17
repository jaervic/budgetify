import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CATALOG } from '@/data/catalog'
import { DEFAULT_CLINIC, DEFAULT_NOTES, DEFAULT_RATE, todayIso } from '@/data/defaults'
import { computeBudget } from '@/lib/calc'
import { BudgetPdf } from '@/pdf/BudgetPdf'
import type { Budget, CatalogService, Item, PageSize } from '@/types'

/**
 * Logo PNG 64×64 sólido. Basta para que el encabezado mida lo mismo que con un
 * logo real, que es lo que empujaba las firmas a una segunda hoja.
 */
const LOGO_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeUlEQVR4nO3PUQkAIBTAwIfZ7WYtQ/hxCIMFuM3a5+uGCxrQgga0oAEtaEALGtCCBrSgAS1oQAsa0IIGtKABLWhACxrQgga0oAEtaEALGtCCBrSgAS1oQAsa0IIGtKABLWhACxrQgga0oAEtaEALGtCCBrSgAS147AJMxdEtmzvJdAAAAABJRU5ErkJggg=='

const CLINIC = {
  ...DEFAULT_CLINIC,
  name: 'Clínica Test',
  rif: 'J-12345678-9',
  doctorName: 'Dr. Gregory House',
  doctorId: 'MPPS 12345',
  logoDataUrl: LOGO_DATA_URL,
  address: 'Av. Principal, Torre Médica, Piso 3',
  phone: '+58 212 555 1234',
}

function itemsFrom(services: CatalogService[]): Item[] {
  return services.map((service, index) => ({
    id: `item_${index}`,
    category: service.category,
    concept: service.concept,
    detail: service.detail,
    formula: service.formula,
  }))
}

/** Los 13 servicios del pack "Cirugía — plantilla base". */
function packItems(): Item[] {
  const pack = DEFAULT_CATALOG.packs.find((entry) => entry.id === 'pack_cirugia_base')
  if (!pack) throw new Error('Falta el pack base de cirugía')
  return itemsFrom(
    pack.services
      .map((entry) => DEFAULT_CATALOG.services.find((service) => service.id === entry.serviceId))
      .filter((service): service is CatalogService => Boolean(service)),
  )
}

/** Presupuesto largo: debe seguir partiéndose en varias hojas. */
function longBudget(): Item[] {
  const services = DEFAULT_CATALOG.services.filter(
    (service) =>
      service.category === 'Honorarios Médicos' || service.category === 'Gastos de Clínica',
  )
  return itemsFrom(Array.from({ length: 40 }, (_, index) => services[index % services.length]))
}

async function renderPdf(items: Item[], pageSize: PageSize): Promise<Uint8Array> {
  const budget: Budget = {
    patient: { name: 'Ana Pérez', ci: 'V-1234567', age: 70 },
    procedure: 'Cura de Prolapso',
    issueDate: todayIso(),
    rate: DEFAULT_RATE,
    items,
    notes: [...DEFAULT_NOTES],
  }
  const element = createElement(BudgetPdf, {
    budget,
    calc: computeBudget(items),
    clinic: CLINIC,
    rateMode: 'auto',
    pageSize,
  }) as React.ReactElement<DocumentProps>
  const blob = await pdf(element).toBlob()
  return new Uint8Array(await blob.arrayBuffer())
}

/** Bytes → latin1 1:1, para poder localizar los objetos del PDF por índice. */
function toLatin1(bytes: Uint8Array): string {
  let text = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    text += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return text
}

/** Infla un `stream` del PDF (`FlateDecode` = zlib). */
async function inflate(data: Uint8Array): Promise<string> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'))
  return new Response(stream).text()
}

function pageCount(buffer: Uint8Array): number {
  // El patrón es ASCII: se conserva aunque el binario no sea texto plano.
  return (toLatin1(buffer).match(/\/Type\s*\/Page[^s]/g) ?? []).length
}

/** Texto de cada hoja, inflando su contenido comprimido. */
async function pagesText(buffer: Uint8Array): Promise<string[]> {
  const raw = toLatin1(buffer)
  const contents = [...raw.matchAll(/\/Contents (\d+) 0 R/g)].map((match) => match[1])
  return Promise.all(
    contents.map(async (number) => {
      const objectStart = raw.indexOf(`${number} 0 obj`)
      const streamIndex = raw.indexOf('stream', objectStart)
      const dictionary = raw.slice(objectStart, streamIndex)
      const length = Number(/\/Length (\d+)/.exec(dictionary)?.[1] ?? 0)
      let dataStart = streamIndex + 'stream'.length
      if (raw[dataStart] === '\r') dataStart += 1
      if (raw[dataStart] === '\n') dataStart += 1
      const content = await inflate(buffer.subarray(dataStart, dataStart + length))
      let text = ''
      for (const part of content.matchAll(/<([0-9a-fA-F]+)>|\((?:\\.|[^\\()])*\)/g)) {
        text += part[1] ? hexToText(part[1]) : part[0].slice(1, -1)
      }
      return text
    }),
  )
}

function hexToText(hex: string): string {
  let text = ''
  for (let index = 0; index + 1 < hex.length; index += 2) {
    text += String.fromCharCode(parseInt(hex.slice(index, index + 2), 16))
  }
  return text
}

const SIGNATURE = 'Firma y Sello'

describe('paginación del PDF', () => {
  it('el presupuesto típico con logo cabe en una hoja A4', async () => {
    expect(pageCount(await renderPdf(packItems(), 'A4'))).toBe(1)
  }, 30_000)

  it('el presupuesto típico con logo cabe en una hoja Carta', async () => {
    expect(pageCount(await renderPdf(packItems(), 'Letter'))).toBe(1)
  }, 30_000)

  it('un presupuesto largo sigue partiéndose en varias hojas', async () => {
    expect(pageCount(await renderPdf(longBudget(), 'A4'))).toBeGreaterThan(1)
  }, 30_000)

  it('el bloque de firmas se repite al pie de todas las hojas', async () => {
    const pages = await pagesText(await renderPdf(packItems(), 'A4'))
    expect(pages).toHaveLength(1)
    expect(pages[0]).toContain(SIGNATURE)
  }, 30_000)

  it('en un presupuesto largo las firmas salen en cada hoja', async () => {
    const pages = await pagesText(await renderPdf(longBudget(), 'A4'))
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.every((page) => page.includes(SIGNATURE))).toBe(true)
  }, 30_000)
})
