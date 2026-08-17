import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, clearRateLimitBuckets } from './rateLimit'

function makeRequest(overrides: { ip?: string } = {}): Request {
  const headers: Record<string, string> = {}
  if (overrides.ip) headers['x-forwarded-for'] = overrides.ip
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
  })
}

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitBuckets()
  })

  it('allows requests under the limit', () => {
    const r1 = rateLimit(makeRequest({ ip: '1.2.3.4' }), { max: 3 })
    const r2 = rateLimit(makeRequest({ ip: '1.2.3.4' }), { max: 3 })
    expect(r1.response).toBeNull()
    expect(r2.response).toBeNull()
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
  })

  it('returns 429 when the limit is exceeded', () => {
    rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    const blocked = rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    expect(blocked.response).not.toBeNull()
    expect(blocked.response!.status).toBe(429)
    expect(blocked.remaining).toBe(0)
    expect(blocked.response!.headers.get('Retry-After')).not.toBeNull()
  })

  it('separates buckets by client IP', () => {
    rateLimit(makeRequest({ ip: '9.9.9.9' }), { max: 1 })
    const other = rateLimit(makeRequest({ ip: '8.8.8.8' }), { max: 1 })
    expect(other.response).toBeNull()
  })

  it('separates buckets by key prefix', () => {
    rateLimit(makeRequest({ ip: '1.1.1.1' }), { max: 1, keyPrefix: 'a' })
    const other = rateLimit(makeRequest({ ip: '1.1.1.1' }), { max: 1, keyPrefix: 'b' })
    expect(other.response).toBeNull()
  })
})
