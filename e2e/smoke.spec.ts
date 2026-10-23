import { expect, test, type Locator, type Page } from '@playwright/test'
import { contrastOf } from './contrast'

/** Mínimo de WCAG AA para texto normal. */
const MINIMO = 4.5

/** Textos que hay que poder leer sin esfuerzo, en cualquier tema. */
function textosClave(page: Page): Array<[string, Locator]> {
  return [
    ['el título', page.getByRole('heading', { level: 1 })],
    // La barra de acciones de móvil deja un botón igual en el DOM (oculto),
    // así que se mide el visible.
    [
      'el botón primario',
      page.getByRole('button', { name: 'Descargar PDF' }).filter({ visible: true }),
    ],
    [
      'el texto secundario',
      page.getByText('Presupuestos médicos y cotizaciones · gratis y sin instalar'),
    ],
    [
      'el total del documento',
      page
        .getByTestId('document-preview')
        .getByText('TOTAL GENERAL ESTIMADO:'),
    ],
  ]
}

/**
 * Espera a que acaben las transiciones de color. Cambiar de tema las dispara
 * (los botones llevan `transition-all`) y a mitad de camino los colores son
 * intermedios: medir ahí daría un contraste que el usuario nunca ve. Se
 * descartan las animaciones infinitas (los giros de "generando PDF").
 */
async function esperarTransiciones(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finitas = document
      .getAnimations()
      .filter((animacion) => animacion.effect?.getTiming().iterations !== Infinity)
    await Promise.all(finitas.map((animacion) => animacion.finished.catch(() => undefined)))
  })
}

async function comprobarContraste(page: Page, tema: string): Promise<void> {
  await esperarTransiciones(page)
  for (const [nombre, zona] of textosClave(page)) {
    await expect(zona, `${nombre} (${tema})`).toBeVisible()
    expect(
      await contrastOf(zona),
      `contraste insuficiente en ${nombre} con tema ${tema}`,
    ).toBeGreaterThanOrEqual(MINIMO)
  }
}

/**
 * Prueba de humo: la app monta en un navegador de verdad, suma una línea y el
 * texto se lee con el contraste que exige WCAG AA, en claro y en oscuro.
 *
 * No repite lo que ya cubren las pruebas de vitest; vigila lo que solo se ve
 * con estilos reales (los colores se resuelven pintándolos en un canvas) y que
 * la consola quede limpia.
 */
test('arranca, suma una línea y es legible en claro y en oscuro', async ({ page }) => {
  const errores: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    // La tasa del BCV se consulta a un servicio externo: si no hay red, el
    // aviso del navegador no es un fallo de la app.
    if (message.location().url.includes('dolarapi')) return
    errores.push(message.text())
  })
  page.on('pageerror', (error) => errores.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // El camino más corto hasta un presupuesto con importe.
  await page.getByRole('button', { name: 'Línea manual', exact: true }).click()
  await page.getByLabel('Monto en USD').first().fill('1250')
  await expect(page.getByTestId('total-usd')).toHaveText('$1,250.00')

  // El documento (con su barra de total) vive en la pestaña de vista previa.
  await page.getByRole('tab', { name: 'Vista previa' }).click()

  await comprobarContraste(page, 'claro')

  await page.getByRole('button', { name: 'Cambiar tema' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await comprobarContraste(page, 'oscuro')

  expect(errores).toEqual([])
})
