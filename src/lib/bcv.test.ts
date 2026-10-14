import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBcvRate } from './bcv'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response
}

describe('fetchBcvRate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve el promedio y la fecha de actualización', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          promedio: 877.9023,
          fechaActualizacion: '2026-10-14T00:00:00-04:00',
          fuente: 'oficial',
        }),
      ),
    )

    const rate = await fetchBcvRate()
    expect(rate.value).toBe(877.9023)
    expect(rate.updatedAt).toBe('2026-10-14T00:00:00-04:00')
  })

  it('falla si la respuesta HTTP no es correcta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 503)))
    await expect(fetchBcvRate()).rejects.toThrow(/503/)
  })

  it('falla si el formato no es el esperado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ foo: 'bar' })))
    await expect(fetchBcvRate()).rejects.toThrow(/formato/)
  })

  it('propaga un error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')))
    await expect(fetchBcvRate()).rejects.toThrow('sin red')
  })

  it('da un mensaje claro si se agota el tiempo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
    )
    await expect(fetchBcvRate()).rejects.toThrow(/tardó demasiado/)
  })
})
