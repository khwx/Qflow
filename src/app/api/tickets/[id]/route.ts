import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'
import { ticketPatchSchema, validateBody } from '@/lib/validators'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const ownership = await assertOwnership('tickets', id, auth.user.id)
    if (ownership) return ownership
    const { data, error } = await createAdminClient()
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(request, { keyPrefix: 'tickets' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const ownership = await assertOwnership('tickets', id, auth.user.id)
    if (ownership) return ownership
    const result = await validateBody(request, ticketPatchSchema)
    if ('response' in result) return result.response
    const { data, error } = await createAdminClient()
      .from('tickets')
      .update(result.data)
      .eq('id', id)
      .select('*, establishments(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger push notification when ticket is called
    if (result.data.status === 'called' && data) {
      try {
        const origin = request.nextUrl.origin
        await fetch(`${origin}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: data.id,
            ticketNumber: data.ticket_number,
            establishmentId: data.establishment_id,
          }),
        })
      } catch (_pushError) {
        // Non-blocking — push failure shouldn't fail the PATCH
      }
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(request, { keyPrefix: 'tickets' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const ownership = await assertOwnership('tickets', id, auth.user.id)
    if (ownership) return ownership
    const { error } = await createAdminClient()
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
