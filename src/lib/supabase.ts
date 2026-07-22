import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createClientComponentClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase env vars: SUPABASE_URL / SUPABASE_SECRET_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
