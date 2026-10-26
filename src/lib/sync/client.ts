import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, SYNC_CONFIGURED } from './config'
import type {
  RemoteDocumentRow,
  RemoteDraftRow,
  RemoteProfileRow,
  RemoteSnapshot,
  RemoteWriteResult,
  SyncDraftPayload,
} from './types'
import type { SavedDocument } from '@/types'

let clientPromise: Promise<SupabaseClient> | null = null

const MODULE_LOAD_RETRY_MS = 600

/** Error comprensible cuando el navegador no puede descargar el chunk. */
export const SUPABASE_LOAD_ERROR =
  'No se pudo cargar el módulo de la cuenta. Revisa tu conexión y vuelve a intentarlo.'

function messageOf(error: unknown): string | null {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return null
}

/**
 * Los navegadores no usan el mismo texto para un import dinámico fallido.
 * Se reconoce también el mensaje propio para poder ofrecer el botón de recarga.
 */
export function isModuleLoadError(error: unknown): boolean {
  const message = typeof error === 'string' ? error : messageOf(error)
  if (!message) return false
  return (
    message === SUPABASE_LOAD_ERROR ||
    /dynamically imported module|module script failed|error loading dynamically imported module/i.test(
      message,
    )
  )
}

/**
 * Descarga el cliente de Supabase. Un fallo de red puntual puede ocurrir
 * justo cuando Vercel cambia de despliegue; se reintenta una vez. Después se
 * devuelve un mensaje útil en vez de la URL interna del chunk.
 */
async function loadSupabaseModule() {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await import('@supabase/supabase-js')
    } catch (error) {
      lastError = error
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, MODULE_LOAD_RETRY_MS))
      }
    }
  }
  throw new Error(SUPABASE_LOAD_ERROR, { cause: lastError })
}

/**
 * Carga Supabase solo cuando hace falta. El arranque sin cuenta no descarga
 * este chunk ni necesita red.
 */
export function getSupabaseClient(): Promise<SupabaseClient> {
  if (!SYNC_CONFIGURED) {
    return Promise.reject(new Error('La sincronización no está configurada.'))
  }
  if (!clientPromise) {
    clientPromise = loadSupabaseModule()
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
          global: { headers: { 'x-application-name': 'budgetify' } },
        }),
      )
      .catch((error: unknown) => {
        // Permite que un nuevo intento vuelva a descargar el módulo.
        clientPromise = null
        throw error
      })
  }
  return clientPromise
}

export async function getSession(): Promise<Session | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function onAuthChange(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
): Promise<() => void> {
  const supabase = await getSupabaseClient()
  const { data } = supabase.auth.onAuthStateChange(listener)
  return () => data.subscription.unsubscribe()
}

export async function signInWithEmail(email: string): Promise<void> {
  const supabase = await getSupabaseClient()
  const redirectTo =
    typeof window === 'undefined' ? undefined : window.location.origin
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  })
  if (error) throw error
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
}

export interface PasswordSignUpResult {
  /** Supabase pide confirmar el correo antes de crear la sesión. */
  needsConfirmation: boolean
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<PasswordSignUpResult> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return { needsConfirmation: data.session === null }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = await getSupabaseClient()
  const redirectTo =
    typeof window === 'undefined' ? undefined : window.location.origin
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  })
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function signOutRemote(): Promise<void> {
  const supabase = await getSupabaseClient()
  // `local` borra la sesión del dispositivo aunque no haya red. En un equipo
  // compartido eso es más importante que revocar el refresh token en servidor.
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function deleteRemoteAccount(): Promise<void> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: true },
  })
  if (error) throw error
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error))
  }
}

/** Cursor con un pequeño solapamiento para no perder filas del mismo segundo. */
function sinceCursor(lastPulledAt: string | null): string | null {
  if (!lastPulledAt) return null
  const timestamp = Date.parse(lastPulledAt)
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp - 1_000).toISOString()
}

export async function pullRemote(
  userId: string,
  lastPulledAt: string | null,
): Promise<RemoteSnapshot> {
  const supabase = await getSupabaseClient()

  const profileQuery = supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  let documentsQuery = supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true })
    .limit(500)
  const cursor = sinceCursor(lastPulledAt)
  if (cursor) documentsQuery = documentsQuery.gt('updated_at', cursor)

  const draftsQuery = supabase.from('drafts').select('*').eq('user_id', userId)

  const [profileResult, documentsResult, draftsResult] = await Promise.all([
    profileQuery,
    documentsQuery,
    draftsQuery,
  ])

  if (profileResult.error) throw profileResult.error
  if (documentsResult.error) throw documentsResult.error
  if (draftsResult.error) throw draftsResult.error

  return {
    profile: (profileResult.data as RemoteProfileRow | null) ?? null,
    documents: (documentsResult.data as RemoteDocumentRow[] | null) ?? [],
    drafts: (draftsResult.data as RemoteDraftRow[] | null) ?? [],
  }
}

export async function upsertProfile(
  userId: string,
  payload: string,
): Promise<RemoteWriteResult> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, payload, enc: false, iv: null, alg: null },
      { onConflict: 'user_id' },
    )
    .select('rev, updated_at')
    .single()
  if (error) throw error
  return data as RemoteWriteResult
}

export async function upsertDocument(
  userId: string,
  document: SavedDocument,
): Promise<RemoteWriteResult> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .upsert(
      {
        user_id: userId,
        id: document.id,
        kind: document.kind,
        payload: JSON.stringify(document),
        enc: false,
        iv: null,
        alg: null,
        saved_at: document.savedAt,
        // Un documento que sigue en el historial local debe quedar activo. Si
        // la persona deshizo un borrado, esto lo resucita también en la nube.
        deleted_at: null,
      },
      { onConflict: 'user_id,id' },
    )
    .select('rev, updated_at')
    .single()
  if (error) throw error
  return data as RemoteWriteResult
}

export async function deleteDocumentRemote(
  userId: string,
  id: string,
): Promise<RemoteWriteResult | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .is('deleted_at', null)
    .select('rev, updated_at')
    .maybeSingle()
  if (error) throw error
  return (data as RemoteWriteResult | null) ?? null
}

export async function upsertDraft(
  userId: string,
  mode: 'budget' | 'quote',
  payload: SyncDraftPayload,
): Promise<RemoteWriteResult> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('drafts')
    .upsert(
      {
        user_id: userId,
        mode,
        payload: JSON.stringify(payload),
        enc: false,
        iv: null,
        alg: null,
      },
      { onConflict: 'user_id,mode' },
    )
    .select('rev, updated_at')
    .single()
  if (error) throw error
  return data as RemoteWriteResult
}

export interface RemoteCounts {
  hasProfile: boolean
  documents: number
}

export async function fetchRemoteCounts(userId: string): Promise<RemoteCounts> {
  const supabase = await getSupabaseClient()
  const [profile, documents] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
  ])
  if (profile.error) throw profile.error
  if (documents.error) throw documents.error
  return {
    hasProfile: (profile.count ?? 0) > 0,
    documents: documents.count ?? 0,
  }
}

export function errorMessage(error: unknown): string {
  if (isModuleLoadError(error)) return SUPABASE_LOAD_ERROR
  return messageOf(error) ?? 'No se pudo sincronizar. Inténtalo de nuevo.'
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}
