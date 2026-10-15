import type { Locator } from '@playwright/test'

/**
 * Mide el contraste real (WCAG 2.1) de un texto contra el fondo que tiene
 * detrás.
 *
 * Chromium devuelve los colores en `oklch()` y desde Node no hay forma de
 * convertirlos; dentro de la página sí: se pinta cada color en un canvas de
 * 1×1 y se leen los píxeles. El fondo se busca subiendo por los antepasados
 * (el primero opaco) y componiendo las capas semitransparentes que haya por
 * el camino, que es justo lo que hace el ojo.
 */
export async function contrastOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no tiene canvas 2D')

    /**
     * Color CSS → [r, g, b, alfa]. Si el navegador no entiende el valor deja
     * el anterior, que se pone a transparente a propósito para poder notarlo.
     */
    const parse = (css: string): [number, number, number, number] => {
      context.fillStyle = 'rgba(0, 0, 0, 0)'
      context.fillStyle = css
      context.clearRect(0, 0, 1, 1)
      context.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
      return [r, g, b, a / 255]
    }

    /** Pinta `top` encima de `bottom` (ambos con alfa). */
    const over = (top: number[], bottom: number[]): number[] =>
      [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3]))

    const background = (): number[] => {
      const layers: Array<[number, number, number, number]> = []
      for (let node: Element | null = element; node; node = node.parentElement) {
        const color = parse(getComputedStyle(node).backgroundColor)
        if (color[3] === 0) continue
        layers.push(color)
        if (color[3] === 1) break
      }
      // Blanco por defecto: si nada pinta fondo, es el lienzo del navegador.
      return layers.reduce<number[]>(
        (fondo, layer) => over(layer, fondo),
        [255, 255, 255, 1],
      )
    }

    const fondo = background()
    const texto = over(parse(getComputedStyle(element).color), fondo)

    /** Luminancia relativa según WCAG. */
    const luminance = (color: number[]): number => {
      const channel = (value: number): number => {
        const s = value / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }
      return (
        0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2])
      )
    }

    const [claro, oscuro] = [luminance(texto), luminance(fondo)].sort((a, b) => b - a)
    return (claro + 0.05) / (oscuro + 0.05)
  })
}
