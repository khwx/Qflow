import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'

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

    const { data, error } = await createAdminClient()
      .from('customers')
      .select('*')
      .eq('establishment_id', targetEstId)
      .order('total_points', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
