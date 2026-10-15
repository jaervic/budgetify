/** Lado mayor (px) al que se reduce la imagen guardada. */
const MAX_SIZE = 512
/** Tamaño máximo del archivo de entrada. */
const MAX_INPUT_BYTES = 1_500_000
/**
 * Tope del data URL resultante (≈400 KB de imagen). Entre logo, firma y sello
 * hay que quedarse muy por debajo de los ~5 MB que suele tolerar localStorage:
 * pasarse significa dejar de poder guardar el presupuesto.
 */
const MAX_DATA_URL_CHARS = 550_000

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

/** ¿Queda algún píxel semitransparente? (decide si es seguro usar JPEG). */
function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = context.getImageData(0, 0, width, height)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true
  }
  return false
}

/**
 * Convierte un archivo de imagen en un data URL listo para guardar y para
 * incrustar en el PDF.
 *
 * Se restringe a PNG/JPG porque es lo que @react-pdf/renderer incrusta de forma
 * fiable (SVG/WEBP no están soportados). La imagen se reduce y, si aun así pesa
 * demasiado, se recomprime (JPEG cuando no hay transparencia) hasta caber en el
 * presupuesto de almacenamiento: guardar tres imágenes enormes era la vía más
 * rápida a quedarse sin sitio para el presupuesto.
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato no soportado. Usa una imagen PNG o JPG.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La imagen es demasiado grande (máximo 1,5 MB).')
  }

  const dataUrl = await readFileAsDataUrl(file)
  if (typeof document === 'undefined') return dataUrl
  const image = await loadImage(dataUrl)

  let scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height))
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return dataUrl

    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const png = canvas.toDataURL('image/png')
    if (png.length <= MAX_DATA_URL_CHARS) return png

    if (!hasTransparency(context, canvas.width, canvas.height)) {
      const jpeg = canvas.toDataURL('image/jpeg', 0.82)
      if (jpeg.length <= MAX_DATA_URL_CHARS) return jpeg
    }

    // Sigue pesando demasiado: se reduce y se vuelve a intentar.
    scale *= 0.6
  }

  throw new Error(
    'La imagen es demasiado grande incluso después de reducirla. Prueba con una más simple.',
  )
}
