import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { normalizeSlug } from '@/lib/validators'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = await rateLimit(_request, { keyPrefix: 'public-establishments', max: 60, windowMs: 60_000 })
  if (limited.response) return limited.response

  const { slug } = await params
  const normalized = normalizeSlug(slug)

  try {
    const supabase = createAdminClient()

    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', normalized)
      .eq('is_active', true)
      .single()

    if (estError || !establishment) {
      return NextResponse.json({ error: 'Establishment not found' }, { status: 404 })
    }

    const { data: queues, error: queueError } = await supabase
      .from('queues')
      .select('*')
      .eq('establishment_id', establishment.id)
      .eq('is_active', true)
      .order('name')

    if (queueError) {
      return NextResponse.json({ error: queueError.message }, { status: 500 })
    }

    return NextResponse.json({ establishment, queues: queues ?? [] })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
