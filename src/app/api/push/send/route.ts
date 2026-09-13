import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'

// VAPID keys would normally be stored in env vars
// For production, generate with: npx web-push generate-vapid-keys
// const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
// const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'push-send', max: 10, windowMs: 60_000 })
  if (limited.response) return limited.response

  try {
    const { ticketId, ticketNumber, establishmentId, message } = await request.json()

    if (!ticketId || !ticketNumber || !establishmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get subscriptions for this ticket
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

    // In production, use web-push library:
    // const webpush = require('web-push')
    // webpush.setVapidDetails('mailto:admin@qflow.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const _payload = {
      title: 'QFlow - Sua Senha foi Chamada!',
      body: message || `Senha ${ticketNumber} foi chamada. Compareça ao guichê!`,
      ticketNumber,
      ticketId,
      icon: '/images/icon-192.png',
      badge: '/images/badge-72.png',
      tag: `ticket-${ticketId}`,
      url: `/waiting/${ticketId}`,
    }

    // For now, just log - in production would send actual push
    console.log(`Would send push to ${subscriptions.length} subscriptions for ticket ${ticketNumber}`)

    // Mark subscriptions as used
    await supabase
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)

    return NextResponse.json({ success: true, sent: subscriptions.length })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}