import { z } from 'zod'

/**
 * Tasa oficial (BCV) vía DolarAPI Venezuela.
 * Es un servicio gratuito, sin clave y con CORS abierto, por lo que se puede
 * consumir directamente desde el navegador (la app sigue siendo 100% frontend).
 * No existe un API oficial del BCV con CORS.
 */
export const BCV_ENDPOINT = 'https://ve.dolarapi.com/v1/dolares/oficial'

const TIMEOUT_MS = 8000

const payloadSchema = z.object({
  promedio: z.number().finite().positive(),
  fechaActualizacion: z.string().optional(),
  fuente: z.string().optional(),
})

export interface BcvRate {
  /** Bs. por 1 USD. */
  value: number
  /** Fecha de actualización informada por la fuente. */
  updatedAt: string | null
}

/**
 * Consulta la tasa oficial del BCV.
 * Lanza un `Error` con un mensaje legible si falla o se agota el tiempo.
 */
export async function fetchBcvRate(signal?: AbortSignal): Promise<BcvRate> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller)

  try {
    const response = await fetch(BCV_ENDPOINT, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`El servicio de la tasa BCV respondió con ${response.status}.`)
    }
    const parsed = payloadSchema.safeParse(await response.json())
    if (!parsed.success) {
      throw new Error('La respuesta de la tasa BCV no tiene el formato esperado.')
    }
    return {
      value: parsed.data.promedio,
      updatedAt: parsed.data.fechaActualizacion ?? null,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La consulta de la tasa BCV tardó demasiado.')
    }
    if (error instanceof Error) throw error
    throw new Error('No se pudo obtener la tasa BCV.')
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
