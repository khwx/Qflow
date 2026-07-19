import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishment_id')
    const status = searchParams.get('status')

    let query = createAdminClient()
      .from('orders')
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
    const body = await request.json()
    const { ticket_id, establishment_id, customer_id, items, total, notes } = body

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
