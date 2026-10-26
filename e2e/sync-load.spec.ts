import { expect, test } from '@playwright/test'

// Sin service worker para poder interceptar el chunk real de Supabase.
test.use({ serviceWorkers: 'block' })

/**
 * El chunk de Supabase se descarga solo al usar la cuenta. Si la red falla,
 * no se debe enseñar la URL interna ni dejar el formulario bloqueado.
 */
test('avisa y ofrece reintentar si no puede cargar el módulo de la cuenta', async ({
  page,
}) => {
  await page.route('**/assets/supabase-*.js', (route) => route.abort('failed'))

  await page.goto('/')
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('button', { name: /Inicia sesión para sincronizar/ }).click()

  await page.getByLabel('Correo electrónico').fill('persona@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('12345678')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText(
    'No se pudo cargar el módulo de la cuenta',
  )
  await expect(page.getByRole('alert')).not.toContainText('https://')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})
