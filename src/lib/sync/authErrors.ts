import { errorMessage } from './client'

/**
 * Traduce los errores de Supabase Auth a mensajes que se puedan mostrar en la
 * interfaz. No se muestran detalles internos ni códigos.
 */
export function authErrorMessage(error: unknown): string {
  const raw = errorMessage(error)
  const message = raw.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('user already registered') || message.includes('already registered')) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.'
  }
  if (message.includes('password should be at least')) {
    return 'La contraseña es demasiado corta. Usa al menos 8 caracteres.'
  }
  if (message.includes('email not confirmed')) {
    return 'La cuenta todavía no está confirmada. Revisa tu correo o desactiva la confirmación en Supabase.'
  }
  if (message.includes('signups not allowed')) {
    return 'El registro con contraseña está desactivado en este proyecto de Supabase.'
  }
  if (message.includes('email address not authorized')) {
    return 'Supabase no puede enviar correos a esa dirección. Revisa la configuración SMTP.'
  }
  if (message.includes('error sending') && message.includes('email')) {
    return 'No se pudo enviar el correo. Revisa la configuración SMTP de Supabase.'
  }
  if (message.includes('email address') && message.includes('invalid')) {
    return 'El correo no es válido.'
  }
  if (
    message.includes('rate limit') ||
    message.includes('only request this after') ||
    message.includes('too many requests')
  ) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  }
  if (message.includes('auth session missing') || message.includes('session missing')) {
    return 'Tu sesión ha caducado. Vuelve a entrar.'
  }
  return raw || 'No se pudo completar la operación.'
}
