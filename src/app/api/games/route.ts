import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'
import { gameSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishment_id')

    let query = createAdminClient()
      .from('games')
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
  const limited = rateLimit(request, { keyPrefix: 'games' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const result = await validateBody(request, gameSchema)
    if ('response' in result) return result.response
    const { name, description, type, establishment_id, points_reward, config } =
      result.data

    const ownership = await assertOwnership('establishments', establishment_id, auth.user.id)
    if (ownership) return ownership

    const { data, error } = await createAdminClient()
      .from('games')
      .insert({
        name,
        description,
        type,
        establishment_id,
        points_reward,
        config: config || {},
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
