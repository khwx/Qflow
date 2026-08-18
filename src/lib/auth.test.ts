import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-anon-key'

const mockGetUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}))

import { authenticateRequest } from './auth'

function makeRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost/api/test', { headers })
}

describe('authenticateRequest', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('returns 401 when the Authorization header is missing', async () => {
    const res = await authenticateRequest(makeRequest({}))
    expect('response' in res).toBe(true)
    if ('response' in res) expect(res.response.status).toBe(401)
  })

  it('returns 401 when the header is not a Bearer token', async () => {
    const res = await authenticateRequest(
      makeRequest({ authorization: 'Basic abc' })
    )
    expect('response' in res).toBe(true)
  })

  it('returns 401 when the bearer token is empty', async () => {
    const res = await authenticateRequest(
      makeRequest({ authorization: 'Bearer ' })
    )
    expect('response' in res).toBe(true)
  })

  it('returns 401 when token verification fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid token' },
    })
    const res = await authenticateRequest(
      makeRequest({ authorization: 'Bearer xyz' })
    )
    expect('response' in res).toBe(true)
    if ('response' in res) expect(res.response.status).toBe(401)
  })

  it('returns the user for a valid token', async () => {
    const user = { id: 'u1', email: 'a@example.com' }
    mockGetUser.mockResolvedValue({ data: { user }, error: null })
    const res = await authenticateRequest(
      makeRequest({ authorization: 'Bearer valid' })
    )
    expect('user' in res).toBe(true)
    if ('user' in res) expect(res.user).toEqual(user)
  })
})
