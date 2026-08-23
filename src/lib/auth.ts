import { NextResponse } from 'next/server'
import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'

let verifyClient: SupabaseClient | null = null

function getVerifyClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars for token verification (NEXT_PUBLIC_SUPABASE_URL + PUBLISHABLE_KEY/ANON_KEY)'
    )
  }
  if (!verifyClient) {
    verifyClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return verifyClient
}

export type AuthResult = { user: User } | { response: NextResponse }

/**
 * Verifies the `Authorization: Bearer <jwt>` header against Supabase and
 * returns the authenticated user. Endpoints using the service-role client
 * must call this to avoid unauthenticated access.
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult> {
  const header =
    request.headers.get('authorization') ||
    request.headers.get('Authorization')

  if (!header || !header.startsWith('Bearer ')) {
    return {
      response: NextResponse.json(
        { error: 'Missing or malformed Authorization header' },
        { status: 401 }
      ),
    }
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'Missing bearer token' },
        { status: 401 }
      ),
    }
  }

  try {
    const { data, error } = await getVerifyClient().auth.getUser(token)
    if (error || !data.user) {
      return {
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        ),
      }
    }
    return { user: data.user }
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      ),
    }
  }
}
