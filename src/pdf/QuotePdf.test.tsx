import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CLINIC, DEFAULT_RATE, todayIso } from '@/data/defaults'
import { DEFAULT_PRODUCTS } from '@/data/products'
import { computeQuote } from '@/lib/quoteCalc'
import { QuotePdf } from '@/pdf/QuotePdf'
import type { PageSize, Quote, QuoteItem } from '@/types'

function items(count: number): QuoteItem[] {
  return Array.from({ length: count }, (_, index) => {
    const product = DEFAULT_PRODUCTS[index % DEFAULT_PRODUCTS.length]
    return {
      id: `qi_${index}`,
      sourceProductId: product.id,
      code: `${product.code}-${index}`,
      description: product.description,
      qty: 1,
      unit: product.unit,
      unitPriceUsd: product.priceUsd,
      taxRate: product.taxRate,
    }
  })
}

function quote(count: number): Quote {
  return {
    number: '000002151',
    client: {
      name: 'Unidad Clínica de Prueba',
      code: '0000008',
      rif: 'J-12345678-9',
      phones: '0212-555-1234',
      address: 'Av. Principal, Torre Médica, Piso 3',
    },
    seller: 'Luis Pérez',
    office: 'Principal',
    transport: 'Delivery',
    currency: 'USD',
    showBothCurrencies: false,
    issueDate: todayIso(),
    dueDate: todayIso(),
    purchaseOrder: 'OC-2026-001',
    description: 'Reposición de insumos para el área de consulta.',
    rate: DEFAULT_RATE,
    items: items(count),
  }
}

async function renderQuotePdf(q: Quote, pageSize: PageSize): Promise<Uint8Array> {
  const element = createElement(QuotePdf, {
    quote: q,
    calc: computeQuote(q.items),
    clinic: {
      ...DEFAULT_CLINIC,
      name: 'Empresa de Prueba',
      rif: 'J-12345678-9',
      address: 'Av. Principal',
      phone: '0212-555-1234',
    },
    pageSize,
  }) as React.ReactElement<DocumentProps>
  const blob = await pdf(element).toBlob()
  return new Uint8Array(await blob.arrayBuffer())
}

async function renderPdf(count: number, pageSize: PageSize): Promise<Uint8Array> {
  return renderQuotePdf(quote(count), pageSize)
}

function toLatin1(bytes: Uint8Array): string {
  let text = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    text += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return text
}

async function inflate(data: Uint8Array): Promise<string> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'))
  return new Response(stream).text()
}

function pageCount(buffer: Uint8Array): number {
  return (toLatin1(buffer).match(/\/Type\s*\/Page[^s]/g) ?? []).length
}

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

describe('paginación del PDF de cotización', () => {
  it('una cotización típica cabe en una hoja Carta', async () => {
    expect(pageCount(await renderPdf(8, 'Letter'))).toBe(1)
  }, 30_000)

  it('una cotización de 40 líneas ocupa dos hojas Carta', async () => {
    expect(pageCount(await renderPdf(40, 'Letter'))).toBe(2)
  }, 30_000)

  it('la primera hoja muestra el número y los datos completos del cliente', async () => {
    const pages = await pagesText(await renderPdf(8, 'Letter'))
    expect(pages).toHaveLength(1)
    expect(pages[0]).toContain('000002151')
    expect(pages[0]).toContain('Unidad Clínica de Prueba')
    expect(pages[0]).toContain('Luis Pérez')
    expect(pages[0]).toContain('Orden de compra')
  }, 30_000)

  it('repite el número, el cliente y los datos opcionales en las hojas siguientes', async () => {
    const pages = await pagesText(await renderPdf(40, 'Letter'))
    expect(pages.length).toBeGreaterThan(1)

    for (const page of pages.slice(1)) {
      expect(page).toContain('000002151')
      expect(page).toContain('Unidad Clínica de Prueba')
      expect(page).toContain('Luis Pérez')
      expect(page).toContain('Página')
    }
  }, 30_000)

  it('emite la cotización en bolívares', async () => {
    const q = quote(8)
    q.currency = 'VES'
    const pages = await pagesText(await renderQuotePdf(q, 'Letter'))

    expect(pages[0]).toContain('Moneda: VES')
    expect(pages[0]).toContain('Precio Bs.')
    expect(pages[0]).toContain('Bs.')
  }, 30_000)

  it('muestra ambas monedas cuando la opción está activa', async () => {
    const q = quote(8)
    q.showBothCurrencies = true
    const pages = await pagesText(await renderQuotePdf(q, 'Letter'))

    expect(pages[0]).toContain('Moneda: USD / VES')
    expect(pages[0]).toContain('Total en bolívares')
    expect(pages[0]).toContain('$')
    expect(pages[0]).toContain('Bs.')
  }, 30_000)

  it('incluye las notas y condiciones al final', async () => {
    const q = quote(8)
    q.terms = 'Pago a 30 días. Garantía de 6 meses.'
    const pages = await pagesText(await renderQuotePdf(q, 'Letter'))

    expect(pages[0]).toContain('Notas y condiciones')
    expect(pages[0]).toContain('Garantía de 6 meses')
  }, 30_000)

  it('los campos opcionales largos no rompen la cabecera', async () => {
    const q = quote(40)
    q.client.address = 'A'.repeat(200)
    q.description = 'B'.repeat(300)

    const pages = await pagesText(await renderQuotePdf(q, 'Letter'))
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0]).toContain('Unidad Clínica de Prueba')
    expect(pages[1]).toContain('Unidad Clínica de Prueba')
  }, 30_000)

  it('una cotización de 40 líneas con ambas monedas sigue cabiendo en dos hojas', async () => {
    const q = quote(40)
    q.showBothCurrencies = true
    expect(pageCount(await renderQuotePdf(q, 'Letter'))).toBe(2)
  }, 30_000)

  it('los totales aparecen una sola vez, al final', async () => {
    const pages = await pagesText(await renderPdf(40, 'Letter'))
    const count = pages.reduce(
      (total, page) => total + (page.match(/Sub-Total/g) ?? []).length,
      0,
    )
    expect(count).toBe(1)
  }, 30_000)
})
