/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** `false` oculta y desactiva la cuenta aunque haya credenciales. */
  readonly VITE_SYNC_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
