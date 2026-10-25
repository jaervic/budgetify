import { expect, test } from '@playwright/test'

/**
 * La cabecera compacta no amontona iconos: Empresa, Historial y Catálogo viven
 * en «Más opciones» y deben seguir siendo accesibles con un toque.
 */
test('en móvil agrupa las acciones secundarias en Más opciones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Cerrar' }).click()

  await expect(page.getByRole('button', { name: 'Más opciones' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Datos de la empresa' })).toBeHidden()

  await page.getByRole('button', { name: 'Más opciones' }).click()
  await page.getByRole('menuitem', { name: 'Historial' }).click()

  await expect(page.getByRole('dialog', { name: 'Historial' })).toBeVisible()
})
