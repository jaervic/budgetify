import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrors'

describe('mensajes de error de autenticación', () => {
  it('traduce credenciales incorrectas', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Correo o contraseña incorrectos.',
    )
  })

  it('traduce una cuenta ya registrada', () => {
    expect(authErrorMessage(new Error('User already registered'))).toBe(
      'Ya existe una cuenta con ese correo. Inicia sesión.',
    )
  })

  it('traduce la contraseña corta y el correo sin confirmar', () => {
    expect(authErrorMessage(new Error('Password should be at least 6 characters'))).toContain(
      'demasiado corta',
    )
    expect(authErrorMessage(new Error('Email not confirmed'))).toContain(
      'no está confirmada',
    )
  })

  it('traduce límites de intentos y sesión caducada', () => {
    expect(authErrorMessage(new Error('For security purposes, you can only request this after 60 seconds'))).toContain(
      'Demasiados intentos',
    )
    expect(authErrorMessage(new Error('Auth session missing'))).toContain('caducado')
  })

  it('deja pasar un mensaje desconocido y tiene un texto por defecto', () => {
    expect(authErrorMessage(new Error('Algo raro'))).toBe('Algo raro')
    expect(authErrorMessage(null)).toBe('No se pudo sincronizar. Inténtalo de nuevo.')
  })
})
