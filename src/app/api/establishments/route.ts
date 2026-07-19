import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { data, error } = await createAdminClient()
      .from('establishments')
      .select('*')
      .eq('is_active', true)
      .order('name')

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
    const { name, slug, description, category, address, phone, primary_color } = body

    const { data, error } = await createAdminClient()
      .from('establishments')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        category,
        address,
        phone,
        primary_color: primary_color || '#4f46e5',
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
