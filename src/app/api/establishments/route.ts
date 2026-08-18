import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { establishmentSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    const { data, error } = await createAdminClient()
      .from('establishments')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { keyPrefix: 'establishments' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const result = await validateBody(request, establishmentSchema)
    if ('response' in result) return result.response
    const { name, slug, description, category, address, phone, primary_color } =
      result.data

    const { data, error } = await createAdminClient()
      .from('establishments')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        category,
        address,
        phone,
        primary_color: primary_color || '#4f46e5',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
