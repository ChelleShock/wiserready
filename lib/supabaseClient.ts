import { createClient, SupabaseClient } from '@supabase/supabase-js'

type GlobalWithSupabase = typeof globalThis & {
  supabaseAdmin?: SupabaseClient
}

export function getSupabaseClient(): SupabaseClient {
  const globalForSupabase = globalThis as GlobalWithSupabase
  if (!globalForSupabase.supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY

    if (!url) {
      throw new Error('SUPABASE_URL env var is not set')
    }
    if (!key) {
      throw new Error(
        'Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY',
      )
    }

    globalForSupabase.supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    })
  }

  return globalForSupabase.supabaseAdmin
}
