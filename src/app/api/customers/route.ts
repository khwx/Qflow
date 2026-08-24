import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'
import { jsonWithPagination, parsePagination } from '@/lib/pagination'

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('est')
    const establishmentId = searchParams.get('establishment_id')

    let targetEstId = establishmentId ?? undefined
    if (!targetEstId && slug) {
      const { data: est } = await createAdminClient()
        .from('establishments')
        .select('id')
        .eq('slug', slug)
        .single()
      targetEstId = est?.id ?? undefined
    }

    if (!targetEstId) {
      return NextResponse.json(
        { error: 'establishment_id or est (slug) is required' },
        { status: 400 }
      )
    }

    const ownership = await assertOwnership(
      'establishments',
      targetEstId,
      auth.user.id
    )
    if (ownership) return ownership

    const pagination = parsePagination(searchParams)
    if ('error' in pagination) {
      return NextResponse.json({ error: pagination.error }, { status: 400 })
    }

    const { data, error, count } = await createAdminClient()
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('establishment_id', targetEstId)
      .order('total_points', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return jsonWithPagination(data, pagination, count ?? 0)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
