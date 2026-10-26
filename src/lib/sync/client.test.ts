import { describe, expect, it } from 'vitest'
import { SUPABASE_LOAD_ERROR, errorMessage, isModuleLoadError } from './client'

describe('carga del cliente de Supabase', () => {
  it('convierte el fallo del import dinámico en un mensaje útil', () => {
    const message = errorMessage(
      new Error(
        'Failed to fetch dynamically imported module: https://budgetify-silk.vercel.app/assets/supabase-CVwsoVID.js',
      ),
    )

    expect(message).toBe(SUPABASE_LOAD_ERROR)
    expect(message).not.toContain('https://')
  })

  it('reconoce también el texto de Safari y el mensaje propio', () => {
    expect(isModuleLoadError(new Error('Importing a module script failed.'))).toBe(true)
    expect(isModuleLoadError(SUPABASE_LOAD_ERROR)).toBe(true)
    expect(isModuleLoadError(new Error('Invalid login credentials'))).toBe(false)
  })

  it('deja intactos los errores normales', () => {
    expect(errorMessage(new Error('Algo raro'))).toBe('Algo raro')
    expect(errorMessage(null)).toBe('No se pudo sincronizar. Inténtalo de nuevo.')
  })
})
