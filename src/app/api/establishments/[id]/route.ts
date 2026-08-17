import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { establishmentPatchSchema, validateBody } from '@/lib/validators'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await createAdminClient()
      .from('establishments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { keyPrefix: 'establishments' })
  if (limited.response) return limited.response
  try {
    const { id } = await params
    const result = await validateBody(request, establishmentPatchSchema)
    if ('response' in result) return result.response

    const updateData = { ...result.data }
    if (updateData.slug) {
      updateData.slug = updateData.slug.toLowerCase().replace(/\s+/g, '-')
    }

    const { data, error } = await createAdminClient()
      .from('establishments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { keyPrefix: 'establishments' })
  if (limited.response) return limited.response
  try {
    const { id } = await params
    const { error } = await createAdminClient()
      .from('establishments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}