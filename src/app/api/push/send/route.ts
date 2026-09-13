import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:admin@qflow.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'push-send', max: 10, windowMs: 60_000 })
  if (limited.response) return limited.response

  try {
    const { ticketId, ticketNumber, establishmentId, message } = await request.json()

    if (!ticketId || !ticketNumber || !establishmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 })
    }

    const supabase = createAdminClient()

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('ticket_id', ticketId)

    if (error) {
      console.error('Push subscriptions query error:', error)
      return NextResponse.json({ error: 'Failed to query subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    const payload = JSON.stringify({
      title: 'QFlow - Sua Senha foi Chamada!',
      body: message || `Senha ${ticketNumber} foi chamada. Compareça ao guichê!`,
      ticketNumber,
      ticketId,
      icon: '/images/icon-192.png',
      badge: '/images/badge-72.png',
      tag: `ticket-${ticketId}`,
      url: `/waiting/${ticketId}`,
    })

    let sentCount = 0
    const failedIds: string[] = []

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sentCount++
      } catch (err: unknown) {
        console.error(`Push failed for ${sub.id}:`, err)
        failedIds.push(sub.id)
      }
    }

    // Remove expired/invalid subscriptions (404 = subscription expired)
    if (failedIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', failedIds)
    }

    // Update last_used_at for successful ones
    await supabase
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)
      .not('id', 'in', `(${failedIds.join(',')})`)

    return NextResponse.json({ success: true, sent: sentCount, failed: failedIds.length })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
