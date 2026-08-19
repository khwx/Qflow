import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export type OwnedTable =
  | 'establishments'
  | 'queues'
  | 'tickets'
  | 'orders'
  | 'polls'
  | 'games'

export type OwnershipResult = NextResponse | null

/**
 * Enforces that the authenticated user owns the resource (or its parent
 * establishment). The API routes use the service-role client, which bypasses
 * Postgres Row Level Security, so ownership must be enforced in application
 * code — otherwise any valid JWT could mutate every tenant's data.
 *
 * - For `establishments` the owning user is `owner_id` on the row itself.
 * - For child tables (queues, tickets, orders, polls, games) the owning
 *   establishment is resolved via `establishment_id`.
 */
export async function assertOwnership(
  table: OwnedTable,
  id: string,
  userId: string
): Promise<OwnershipResult> {
  const admin = createAdminClient()

  if (table === 'establishments') {
    const { data, error } = await admin
      .from('establishments')
      .select('owner_id')
      .eq('id', id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }
    if (data.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null
  }

  const { data, error } = await admin
    .from(table)
    .select('establishment_id')
    .eq('id', id)
    .single()
  if (error || !data) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  const { data: est, error: estError } = await admin
    .from('establishments')
    .select('owner_id')
    .eq('id', data.establishment_id)
    .single()
  if (estError || !est) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }
  if (est.owner_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
