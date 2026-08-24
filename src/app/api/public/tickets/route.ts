import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { publicTicketSchema, validateBody } from '@/lib/validators'

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'public-tickets', max: 30, windowMs: 60_000 })
  if (limited.response) return limited.response

  const result = await validateBody(request, publicTicketSchema)
  if ('response' in result) return result.response

  const { queue_id, customer_name, customer_phone, customer_email, priority } = result.data

  try {
    const supabase = createAdminClient()

    // Criação atómica (função DB trava a fila e evita números duplicados sob
    // concorrência). Ver PROGRESS 2026-08-23.
    const { data: ticket, error } = await supabase.rpc('create_ticket', {
      p_queue_id: queue_id,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_customer_email: customer_email,
      p_priority: priority || 'normal',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (ticket && (ticket as { error?: string }).error) {
      return NextResponse.json(
        { error: (ticket as { error: string }).error },
        { status: 404 }
      )
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}