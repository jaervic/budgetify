// Borra la cuenta de Supabase Auth y, por cascada, sus perfiles, documentos y
// borradores. El cliente nunca ve la `service_role`: solo la usa esta función.
//
// Desplegar con:
//   supabase functions deploy delete-account

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return json({ error: 'No autorizado.' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) {
    return json({ error: 'La función no está configurada.' }, 500)
  }

  // Verifica el JWT del usuario con la clave anónima.
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return json({ error: 'Sesión no válida.' }, 401)
  }

  // Borra el usuario; las tablas tienen `on delete cascade`.
  const admin = createClient(url, serviceKey)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return json({ error: 'No se pudo borrar la cuenta.' }, 500)
  }

  return json({ ok: true })
})
