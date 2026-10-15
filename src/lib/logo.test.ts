import { describe, expect, it } from 'vitest'
import { fileToLogoDataUrl } from './logo'

/** Crea un `File` falso del tamaño indicado (no hace falta que sea una imagen). */
function fakeFile(size: number, type = 'image/png'): File {
  return new File([new Uint8Array(size)], 'imagen.png', { type })
}

describe('fileToLogoDataUrl', () => {
  it('rechaza formatos que el PDF no incrusta de forma fiable', async () => {
    await expect(fileToLogoDataUrl(fakeFile(10, 'image/webp'))).rejects.toThrow(
      /PNG o JPG/,
    )
    await expect(fileToLogoDataUrl(fakeFile(10, 'image/svg+xml'))).rejects.toThrow(
      /PNG o JPG/,
    )
  })

  it('rechaza archivos demasiado grandes antes de leerlos', async () => {
    await expect(fileToLogoDataUrl(fakeFile(2_000_000))).rejects.toThrow(/1,5 MB/)
  })
})
