import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { queueSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishment_id')

    let query = createAdminClient()
      .from('queues')
      .select('*')
      .order('name')

    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { keyPrefix: 'queues' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const result = await validateBody(request, queueSchema)
    if ('response' in result) return result.response
    const { name, description, establishment_id, estimated_wait_minutes } =
      result.data

    const { data, error } = await createAdminClient()
      .from('queues')
      .insert({
        name,
        description,
        establishment_id,
        estimated_wait_minutes,
        current_number: 0,
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
