import { describe, it, expect, beforeEach } from 'vitest'
import { SupabaseRateLimitStore } from './rateLimitStore'

// Minimal fake of the small slice of the Supabase query-builder API that
// SupabaseRateLimitStore relies on. It keeps an in-memory `rate_limits` table
// so we can exercise the real store logic without a database.
class FakeSupabaseClient {
  private rows = new Map<
    string,
    { count: number; reset_at: string; created_at: string }
  >()

  from(_table: string) {
    return {
      select: (_cols: string) => ({
        eq: (col: string, value: string) => {
          if (col !== 'key') throw new Error('unexpected eq column')
          return {
            maybeSingle: async () => {
              const row = this.rows.get(value)
              return { data: row ?? null, error: null }
            },
          }
        },
      }),
      upsert: (row: { key: string; count: number; reset_at: string; created_at: string }) => {
        this.rows.set(row.key, {
          count: row.count,
          reset_at: row.reset_at,
          created_at: row.created_at,
        })
        return { error: null }
      },
    }
  }

  // Test-only: simulate a transient backend failure on read.
  static failRead() {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: new Error('boom') }),
          }),
        }),
        upsert: () => ({ error: null }),
      }),
    }
  }
}

describe('SupabaseRateLimitStore', () => {
  let client: FakeSupabaseClient
  let store: SupabaseRateLimitStore

  beforeEach(() => {
    client = new FakeSupabaseClient()
    store = new SupabaseRateLimitStore(client as never)
  })

  it('reads and writes a bucket across calls', async () => {
    const now = Date.now()
    await store.set('ip:1', { count: 3, resetAt: now + 60_000, createdAt: now })
    const got = await store.get('ip:1')
    expect(got?.count).toBe(3)
    expect(got?.resetAt).toBe(now + 60_000)
  })

  it('returns null for a missing key', async () => {
    expect(await store.get('nope')).toBeNull()
  })

  it('returns null for an expired bucket', async () => {
    const now = Date.now()
    await store.set('ip:2', { count: 1, resetAt: now - 1, createdAt: now })
    expect(await store.get('ip:2')).toBeNull()
  })

  it('throws on a backend read error (so the caller can fall back)', async () => {
    const failing = new SupabaseRateLimitStore(
      FakeSupabaseClient.failRead() as never
    )
    await expect(failing.get('x')).rejects.toThrow('boom')
  })
})
