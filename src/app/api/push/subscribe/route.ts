import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'push-subscribe', max: 30, windowMs: 60_000 })
  if (limited.response) return limited.response

  try {
    const { endpoint, keys, ticketId, establishmentId } = await request.json()

    if (!endpoint || !keys?.p256dh || !keys?.auth || !ticketId || !establishmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('push_subscriptions').insert({
      ticket_id: ticketId,
      establishment_id: establishmentId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })

    if (error) {
      console.error('Push subscription error:', error)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}