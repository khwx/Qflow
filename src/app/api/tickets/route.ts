import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ticketSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishment_id')
    const status = searchParams.get('status')

    let query = createAdminClient()
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId)
    }

    if (status) {
      query = query.eq('status', status)
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
  try {
    const result = await validateBody(request, ticketSchema)
    if ('response' in result) return result.response
    const { queue_id, establishment_id, ticket_number, customer_name, customer_phone } =
      result.data

    const { data, error } = await createAdminClient()
      .from('tickets')
      .insert({
        queue_id,
        establishment_id,
        ticket_number,
        customer_name,
        customer_phone,
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
