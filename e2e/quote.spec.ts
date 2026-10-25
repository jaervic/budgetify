import { expect, test } from '@playwright/test'

/**
 * Flujo real de cotización: cambiar de modalidad, escoger productos con
 * casillas y comprobar el IVA en la tabla y en la vista previa.
 */
test('cambia a cotización, agrega productos y calcula el IVA', async ({ page }) => {
  const errores: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.location().url.includes('dolarapi')) return
    errores.push(message.text())
  })
  page.on('pageerror', (error) => errores.push(error.message))

  await page.goto('/')
  // En una visita nueva, la guía de inicio tapa la app hasta cerrarla.
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('button', { name: 'Cotización', exact: true }).click()
  await expect(page.getByText('Datos de la cotización')).toBeVisible()

  await page.getByRole('button', { name: 'Agregar productos' }).first().click()
  await page.getByRole('checkbox', { name: /Bata de pacientes/ }).check()
  await page.getByRole('button', { name: 'Agregar (1)' }).click()

  await expect(page.getByTestId('quote-total')).toHaveText('$7.89')
  await expect(page.getByLabel('Código', { exact: true }).first()).toHaveValue('BAYP')

  const bothCurrencies = page.getByRole('checkbox', {
    name: /Mostrar también en bolívares/,
  })
  await bothCurrencies.check()
  await expect(bothCurrencies).toBeChecked()

  await page.getByRole('tab', { name: 'Vista previa' }).click()
  await expect(page.getByTestId('quote-preview')).toContainText('BAYP')
  await expect(page.getByTestId('quote-preview')).toContainText('Neto')

  expect(errores).toEqual([])
})
