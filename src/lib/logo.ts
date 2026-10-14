/** Tamaño máximo (px) del lado mayor del logo guardado. */
const MAX_SIZE = 640
const MAX_BYTES = 3_000_000

const ALLOWED_TYPES = ['image/png', 'image/jpeg']

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('La imagen no es válida.'))
    image.src = src
  })
}

/**
 * Convierte un archivo de imagen en un data URL listo para guardar y para
 * incrustar en el PDF. Se redimensiona para no llenar el localStorage.
 *
 * Se restringe a PNG/JPG porque es lo que @react-pdf/renderer incrusta de forma
 * fiable (SVG/WEBP no están soportados).
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato no soportado. Usa una imagen PNG o JPG.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen es demasiado grande (máximo 3 MB).')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height))
  if (scale === 1 || typeof document === 'undefined') return dataUrl

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext('2d')
  if (!context) return dataUrl

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
