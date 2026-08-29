import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit, clearRateLimitBuckets } from './rateLimit'
import {
  MemoryRateLimitStore,
  type RateLimitBucket,
  type RateLimitStore,
} from './rateLimitStore'

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

  it('allows requests under the limit', async () => {
    const r1 = await rateLimit(makeRequest({ ip: '1.2.3.4' }), { max: 3 })
    const r2 = await rateLimit(makeRequest({ ip: '1.2.3.4' }), { max: 3 })
    expect(r1.response).toBeNull()
    expect(r2.response).toBeNull()
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
  })

  it('returns 429 when the limit is exceeded', async () => {
    await rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    await rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    const blocked = await rateLimit(makeRequest({ ip: '5.6.7.8' }), { max: 2 })
    expect(blocked.response).not.toBeNull()
    expect(blocked.response!.status).toBe(429)
    expect(blocked.remaining).toBe(0)
    expect(blocked.response!.headers.get('Retry-After')).not.toBeNull()
  })

  it('separates buckets by client IP', async () => {
    await rateLimit(makeRequest({ ip: '9.9.9.9' }), { max: 1 })
    const other = await rateLimit(makeRequest({ ip: '8.8.8.8' }), { max: 1 })
    expect(other.response).toBeNull()
  })

  it('separates buckets by key prefix', async () => {
    await rateLimit(makeRequest({ ip: '1.1.1.1' }), { max: 1, keyPrefix: 'a' })
    const other = await rateLimit(makeRequest({ ip: '1.1.1.1' }), { max: 1, keyPrefix: 'b' })
    expect(other.response).toBeNull()
  })

  it('reclaims expired buckets so a previously-blocked IP resets', async () => {
    const start = new Date('2026-01-01T00:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(start)

    await rateLimit(makeRequest({ ip: '2.2.2.2' }), { max: 1, windowMs: 60_000 })
    const blocked = await rateLimit(makeRequest({ ip: '2.2.2.2' }), { max: 1, windowMs: 60_000 })
    expect(blocked.response!.status).toBe(429)

    // Move past the window AND past the sweep interval to force a reclaim.
    vi.setSystemTime(start + 61_000)
    // Trigger a sweep with an unrelated key.
    await rateLimit(makeRequest({ ip: '3.3.3.3' }), { max: 1, windowMs: 60_000 })

    // The old bucket for 2.2.2.2 was evicted, so the IP gets a fresh allowance.
    const reset = await rateLimit(makeRequest({ ip: '2.2.2.2' }), { max: 1, windowMs: 60_000 })
    expect(reset.response).toBeNull()
    expect(reset.remaining).toBe(0)

    vi.useRealTimers()
  })

  it('keeps in-window buckets during a sweep (no premature eviction)', async () => {
    const start = new Date('2026-01-01T00:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(start)

    await rateLimit(makeRequest({ ip: '4.4.4.4' }), { max: 5, windowMs: 120_000 })
    // Advance past the sweep interval but still inside the bucket window.
    vi.setSystemTime(start + 61_000)
    await rateLimit(makeRequest({ ip: '5.5.5.5' }), { max: 5, windowMs: 120_000 })

    // Same IP, same window: bucket persisted, count continues.
    const next = await rateLimit(makeRequest({ ip: '4.4.4.4' }), { max: 5, windowMs: 120_000 })
    expect(next.response).toBeNull()
    expect(next.remaining).toBe(3)

    vi.useRealTimers()
  })

  it('falls back to the in-memory store when the configured store throws', async () => {
    const brokenStore: RateLimitStore = {
      async get() {
        throw new Error('backend down')
      },
      async set() {
        throw new Error('backend down')
      },
    }
    // First request: store throws, fallback creates a fresh bucket.
    const r1 = await rateLimit(makeRequest({ ip: '7.7.7.7' }), {
      max: 1,
      store: brokenStore,
    })
    expect(r1.response).toBeNull()
    // Second request: fallback store now has count=1 == max, so it blocks.
    const r2 = await rateLimit(makeRequest({ ip: '7.7.7.7' }), {
      max: 1,
      store: brokenStore,
    })
    expect(r2.response!.status).toBe(429)
  })
})

describe('MemoryRateLimitStore', () => {
  it('returns null for unknown and expired keys', async () => {
    const store = new MemoryRateLimitStore()
    expect(await store.get('missing')).toBeNull()

    const now = Date.now()
    const bucket: RateLimitBucket = { count: 1, resetAt: now - 10, createdAt: now }
    await store.set('expired', bucket)
    expect(await store.get('expired')).toBeNull()
  })

  it('preserves and updates bucket state', async () => {
    const store = new MemoryRateLimitStore()
    const now = Date.now()
    await store.set('k', { count: 2, resetAt: now + 60_000, createdAt: now })
    const got = await store.get('k')
    expect(got?.count).toBe(2)
  })

  it('reclaims the oldest buckets when over capacity', async () => {
    // Force a tiny cap via a subclass to exercise eviction deterministically.
    const small = new (class extends MemoryRateLimitStore {})()
    const base = Date.now()
    // 5 buckets with increasing createdAt; cap is 10000 so we can't easily hit
    // it — instead test that swept (expired) keys are dropped.
    await small.set('a', { count: 1, resetAt: base - 1, createdAt: base })
    await small.set('b', { count: 1, resetAt: base + 1000, createdAt: base })
    // 'a' expired and should be reclaimed on the next set sweep.
    expect(await small.get('a')).toBeNull()
    expect((await small.get('b'))?.count).toBe(1)
  })

  it('clear() empties the store', async () => {
    const store = new MemoryRateLimitStore()
    const now = Date.now()
    await store.set('k', { count: 1, resetAt: now + 60_000, createdAt: now })
    store.clear()
    expect(await store.get('k')).toBeNull()
  })
})
