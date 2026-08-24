import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'
import { jsonWithPagination, parsePagination } from '@/lib/pagination'
import { orderSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishment_id')
    const status = searchParams.get('status')

    const pagination = parsePagination(searchParams)
    if ('error' in pagination) {
      return NextResponse.json({ error: pagination.error }, { status: 400 })
    }

    let query = createAdminClient()
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(
      pagination.offset,
      pagination.offset + pagination.limit - 1
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return jsonWithPagination(data, pagination, count ?? 0)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'orders' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const result = await validateBody(request, orderSchema)
    if ('response' in result) return result.response
    const { ticket_id, establishment_id, customer_id, items, total, notes } =
      result.data

    const ownership = await assertOwnership('establishments', establishment_id, auth.user.id)
    if (ownership) return ownership

    const { data, error } = await createAdminClient()
      .from('orders')
      .insert({
        ticket_id,
        establishment_id,
        customer_id,
        items,
        total,
        notes,
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
