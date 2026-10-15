import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

interface VercelHeaderRule {
  source: string
  headers: { key: string; value: string }[]
}

/**
 * Reutiliza las cabeceras de seguridad de `vercel.json` en `vite preview`, para
 * que podamos probar en local exactamente lo que servirá producción.
 * Así hay una sola fuente de verdad.
 */
function vercelPreviewHeaders(): Record<string, string> {
  const path = fileURLToPath(new URL('./vercel.json', import.meta.url))
  const config = JSON.parse(readFileSync(path, 'utf8')) as { headers?: VercelHeaderRule[] }
  const globalRule = config.headers?.find((rule) => rule.source === '/(.*)')
  return Object.fromEntries(
    (globalRule?.headers ?? []).map((header) => [header.key, header.value]),
  )
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'theme-init.js'],
      manifest: {
        name: 'Presupuestos Médicos · Budgetify',
        short_name: 'Presupuestos',
        description:
          'Crea, calcula y descarga presupuestos médicos en PDF, en dólares y bolívares con la tasa BCV.',
        lang: 'es',
        theme_color: '#0284c7',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  preview: {
    headers: vercelPreviewHeaders(),
  },
  build: {
    // El único chunk que supera este tamaño es el de @react-pdf/renderer, que es
    // dinámico y solo se descarga al exportar/imprimir. El resto son pequeños.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        // Separa las librerías grandes en chunks estables (mejor caché).
        // React-pdf NO entra aquí: se queda en su chunk dinámico y solo se
        // descarga al exportar/imprimir.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](radix-ui|@radix-ui)[\\/]/.test(id)) return 'radix'
          if (/[\\/]node_modules[\\/](zod)[\\/]/.test(id)) {
            return 'validation'
          }
          return undefined
        },
      },
    },
  },
})
