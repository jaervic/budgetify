import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // La suite mezcla pruebas de DOM y de generación de PDF. En paralelo, los
    // tests que recorren varios diálogos compiten por CPU y superan el límite
    // por defecto. Se ejecutan los archivos en serie y con más margen.
    fileParallelism: false,
    testTimeout: 20_000,
  },
})
