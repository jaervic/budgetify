// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountDialog } from './AccountDialog'
import { createEmptyBudget } from '@/data/defaults'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useSyncStore } from '@/store/useSyncStore'
import type { SavedDocument } from '@/types'

const auth = vi.hoisted(() => ({
  signIn: vi.fn(async () => {}),
  signInWithPassword: vi.fn(async () => {}),
  signUpWithPassword: vi.fn(async () => ({ needsConfirmation: false })),
  requestPasswordReset: vi.fn(async () => {}),
  changePassword: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  deleteAccount: vi.fn(async () => {}),
  syncNow: vi.fn(async () => {}),
}))

vi.mock('@/lib/sync/engine', () => auth)

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

function openSignedOut() {
  useSyncStore.setState({
    enabled: true,
    accountOpen: true,
    user: null,
    status: 'signed-out',
    error: null,
    pending: 0,
    lastSyncedAt: null,
  })
}

function storedDocuments(count: number): SavedDocument[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `saved_test_${index}`,
    savedAt: `2026-10-0${index + 1}T10:00:00.000Z`,
    kind: 'budget' as const,
    budget: createEmptyBudget(),
  }))
}

describe('AccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBudgetStore.setState({ history: [] })
    openSignedOut()
  })

  afterEach(() => {
    cleanup()
    useSyncStore.setState({
      enabled: false,
      accountOpen: false,
      user: null,
      status: 'disabled',
      error: null,
      pending: 0,
      lastSyncedAt: null,
    })
    useBudgetStore.setState({ history: [] })
  })

  it('avisa de los documentos locales antes de registrarse', () => {
    useBudgetStore.setState({ history: storedDocuments(3) })
    render(<AccountDialog />)

    expect(screen.getByText(/Tienes 3 documentos guardados/)).toBeTruthy()
  })

  it('entra con correo y contraseña', async () => {
    render(<AccountDialog />)

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(auth.signInWithPassword).toHaveBeenCalledWith('ana@example.com', 'secreto123')
  })

  it('crea una cuenta y valida que las contraseñas coincidan', async () => {
    render(<AccountDialog />)

    await userEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'otra-cosa')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(auth.signUpWithPassword).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('no coinciden')

    await userEvent.clear(screen.getByLabelText('Repite la contraseña'))
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'secreto123')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(auth.signUpWithPassword).toHaveBeenCalledWith('ana@example.com', 'secreto123')
  })

  it('envía el enlace mágico', async () => {
    render(<AccountDialog />)

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
    await userEvent.click(
      screen.getByRole('button', { name: 'Entrar con enlace por correo' }),
    )

    expect(auth.signIn).toHaveBeenCalledWith('ana@example.com')
    expect(await screen.findByText(/Te enviamos un enlace/i)).toBeTruthy()
  })

  it('solicita el enlace de recuperación de contraseña', async () => {
    render(<AccountDialog />)

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
    await userEvent.click(
      screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar enlace de recuperación' }),
    )

    expect(auth.requestPasswordReset).toHaveBeenCalledWith('ana@example.com')
    expect(
      await screen.findByText(/para crear una contraseña nueva/i),
    ).toBeTruthy()
  })
})
