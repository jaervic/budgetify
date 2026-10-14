import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Test de humo: renderiza la app completa en el servidor (sin DOM) para
 * detectar errores en tiempo de render. No sustituye a probar en el navegador,
 * pero atrapa roturas evidentes del árbol de componentes.
 */
describe('App', () => {
  it('renderiza sin lanzar errores', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Budgetify')
    expect(html).toContain('Datos del presupuesto')
    expect(html).toContain('Total general')
  })
})
