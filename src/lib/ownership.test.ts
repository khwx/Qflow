import { describe, it, expect, vi, beforeEach } from 'vitest'

const resultsQueue: { data: unknown; error: unknown }[] = []

function makeBuilder() {
  const builder = {
    select: () => builder,
    eq: () => builder,
    single: () => Promise.resolve(resultsQueue.shift() ?? { data: null, error: null }),
  }
  return builder
}

const mockFrom = vi.fn((_table?: string) => makeBuilder())

vi.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({ from: (table: string) => mockFrom(table) }),
}))

import { assertOwnership } from './ownership'

beforeEach(() => {
  resultsQueue.length = 0
  mockFrom.mockClear()
})

describe('assertOwnership — establishments', () => {
  it('returns null when the user owns the establishment', async () => {
    resultsQueue.push({ data: { owner_id: 'u1' }, error: null })
    const res = await assertOwnership('establishments', 'e1', 'u1')
    expect(res).toBeNull()
  })

  it('returns 403 when the user does not own the establishment', async () => {
    resultsQueue.push({ data: { owner_id: 'other' }, error: null })
    const res = await assertOwnership('establishments', 'e1', 'u1')
    expect(res).not.toBeNull()
    if (res) expect(res.status).toBe(403)
  })

  it('returns 404 when the establishment does not exist', async () => {
    resultsQueue.push({ data: null, error: { message: 'not found' } })
    const res = await assertOwnership('establishments', 'e1', 'u1')
    expect(res).not.toBeNull()
    if (res) expect(res.status).toBe(404)
  })
})

describe('assertOwnership — child tables', () => {
  it('resolves the parent establishment and returns null for the owner', async () => {
    resultsQueue.push({ data: { establishment_id: 'e1' }, error: null })
    resultsQueue.push({ data: { owner_id: 'u1' }, error: null })
    const res = await assertOwnership('queues', 'q1', 'u1')
    expect(res).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('queues')
    expect(mockFrom).toHaveBeenCalledWith('establishments')
  })

  it('returns 403 when the parent establishment belongs to another user', async () => {
    resultsQueue.push({ data: { establishment_id: 'e1' }, error: null })
    resultsQueue.push({ data: { owner_id: 'other' }, error: null })
    const res = await assertOwnership('games', 'g1', 'u1')
    expect(res).not.toBeNull()
    if (res) expect(res.status).toBe(403)
  })

  it('returns 404 when the child row does not exist', async () => {
    resultsQueue.push({ data: null, error: { message: 'x' } })
    const res = await assertOwnership('tickets', 't1', 'u1')
    expect(res).not.toBeNull()
    if (res) expect(res.status).toBe(404)
  })

  it('returns 404 when the parent establishment does not exist', async () => {
    resultsQueue.push({ data: { establishment_id: 'e1' }, error: null })
    resultsQueue.push({ data: null, error: { message: 'x' } })
    const res = await assertOwnership('orders', 'o1', 'u1')
    expect(res).not.toBeNull()
    if (res) expect(res.status).toBe(404)
  })

  it('works for polls', async () => {
    resultsQueue.push({ data: { establishment_id: 'e1' }, error: null })
    resultsQueue.push({ data: { owner_id: 'u1' }, error: null })
    const res = await assertOwnership('polls', 'p1', 'u1')
    expect(res).toBeNull()
  })
})
