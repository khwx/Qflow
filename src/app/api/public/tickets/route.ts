import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { publicTicketSchema, validateBody } from '@/lib/validators'

export async function POST(request: Request) {
  const limited = rateLimit(request, { keyPrefix: 'public-tickets', max: 30, windowMs: 60_000 })
  if (limited.response) return limited.response

  const result = await validateBody(request, publicTicketSchema)
  if ('response' in result) return result.response

  const { queue_id, customer_name, customer_phone, customer_email, priority } = result.data

  try {
    const supabase = createAdminClient()

    const { data: queue, error: queueError } = await supabase
      .from('queues')
      .select('id, establishment_id, current_number, name, is_active')
      .eq('id', queue_id)
      .eq('is_active', true)
      .single()

    if (queueError || !queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
    }

    const newNumber = queue.current_number + 1
    const prefix = queue.name.substring(0, 3).toUpperCase()
    const ticketNumber = `${prefix}-${newNumber.toString().padStart(4, '0')}`

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        queue_id: queue.id,
        establishment_id: queue.establishment_id,
        ticket_number: ticketNumber,
        status: 'waiting',
        priority: priority || 'normal',
        customer_name,
        customer_phone,
        customer_email,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
      .from('queues')
      .update({ current_number: newNumber })
      .eq('id', queue.id)

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}