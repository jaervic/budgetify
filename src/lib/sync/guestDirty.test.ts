// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearGuestDirty,
  hasGuestDirty,
  markGuestDirty,
  readGuestDirty,
} from './guestDirty'

describe('cambios sin sesión', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('empieza vacío y marca cada parte una sola vez', () => {
    expect(hasGuestDirty(readGuestDirty())).toBe(false)
    markGuestDirty('profile')
    markGuestDirty('profile')
    expect(readGuestDirty()).toEqual({
      profile: true,
      draftBudget: false,
      draftQuote: false,
    })
    markGuestDirty('draftQuote')
    expect(readGuestDirty().draftQuote).toBe(true)
    expect(hasGuestDirty(readGuestDirty())).toBe(true)
  })

  it('se limpia al iniciar sesión o descartar los datos', () => {
    markGuestDirty('draftBudget')
    clearGuestDirty()
    expect(readGuestDirty()).toEqual({
      profile: false,
      draftBudget: false,
      draftQuote: false,
    })
  })

  it('tolera un valor corrupto', () => {
    localStorage.setItem('budgetify:guest-dirty:v1', '{')
    expect(hasGuestDirty(readGuestDirty())).toBe(false)
  })
})
