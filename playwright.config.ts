import { defineConfig, devices } from '@playwright/test'

/**
 * Prueba de humo en un navegador de verdad.
 *
 * Sirve `dist` con `vite preview`, que aplica las mismas cabeceras de
 * `vercel.json`, así que lo que se prueba se parece a lo que se publica.
 * El `build` tiene que estar hecho antes (en CI se descarga del artefacto).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // Tema del sistema fijo: la app arranca en claro y el test alterna a oscuro.
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
