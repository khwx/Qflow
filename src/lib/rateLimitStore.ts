import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'

export interface RateLimitBucket {
  count: number
  resetAt: number
  createdAt: number
}

/**
 * Pluggable storage backend for the rate limiter.
 *
 * The default deployment uses {@link MemoryRateLimitStore} (per-instance).
 * In multi-instance / serverless production this must be swapped for a shared
 * store (e.g. {@link SupabaseRateLimitStore}) so that the quota is enforced
 * across all replicas instead of per-instance.
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitBucket | null>
  set(key: string, bucket: RateLimitBucket): Promise<void>
}

/**
 * Default in-process store. Preserves the exact prior behaviour: a sliding
 * fixed window per key, with a bounded map that reclaims expired buckets on a
 * sweep tick and drops the oldest entries if the cap is exceeded.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, RateLimitBucket>()
  private readonly maxBuckets = 10_000
  private readonly sweepIntervalMs = 60_000
  private lastSweep = 0

  async get(key: string): Promise<RateLimitBucket | null> {
    const bucket = this.buckets.get(key)
    if (!bucket) return null
    if (bucket.resetAt <= Date.now()) {
      this.buckets.delete(key)
      return null
    }
    return bucket
  }

  async set(key: string, bucket: RateLimitBucket): Promise<void> {
    this.buckets.set(key, bucket)
    this.sweep()
  }

  /** Test helper / shutdown cleanup. */
  clear(): void {
    this.buckets.clear()
    this.lastSweep = 0
  }

  private sweep(): void {
    const now = Date.now()
    if (this.buckets.size === 0) {
      this.lastSweep = now
      return
    }
    const due = now - this.lastSweep >= this.sweepIntervalMs
    if (!due && this.buckets.size <= this.maxBuckets) return

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key)
    }
    this.lastSweep = now

    if (this.buckets.size > this.maxBuckets) {
      const excess = this.buckets.size - this.maxBuckets
      const oldest = [...this.buckets.entries()]
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, excess)
        .map(([key]) => key)
      for (const key of oldest) this.buckets.delete(key)
    }
  }
}

/**
 * Shared store backed by Supabase. Each key is a single row; the window state
 * is read and written atomically enough for rate-limiting purposes (a small
 * amount of eventual inconsistency under extreme concurrency is acceptable for
 * throttling, unlike ticket-number generation which uses a DB transaction).
 *
 * Any failure (missing env, network, permissions) throws so the caller can fall
 * back to the in-memory store rather than blocking legitimate traffic.
 */
export class SupabaseRateLimitStore implements RateLimitStore {
  constructor(private readonly client: SupabaseClient) {}

  async get(key: string): Promise<RateLimitBucket | null> {
    const { data, error } = await this.client
      .from('rate_limits')
      .select('count, reset_at, created_at')
      .eq('key', key)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    const resetAt = Date.parse(data.reset_at)
    if (Number.isNaN(resetAt) || resetAt <= Date.now()) return null

    const createdAt = Number.isNaN(Date.parse(data.created_at))
      ? resetAt - 60_000
      : Date.parse(data.created_at)

    return { count: data.count, resetAt, createdAt }
  }

  async set(key: string, bucket: RateLimitBucket): Promise<void> {
    const { error } = await this.client.from('rate_limits').upsert(
      {
        key,
        count: bucket.count,
        reset_at: new Date(bucket.resetAt).toISOString(),
        created_at: new Date(bucket.createdAt).toISOString(),
      },
      { onConflict: 'key' }
    )
    if (error) throw error
  }
}

let defaultStore: RateLimitStore | null = null

/**
 * Returns the store used by the rate limiter. When a Supabase service-role
 * client is available (production) a shared {@link SupabaseRateLimitStore} is
 * used; otherwise the per-instance {@link MemoryRateLimitStore} is used.
 *
 * The Supabase client is constructed lazily and wrapped so a misconfiguration
 * degrades to the in-memory store instead of crashing the request.
 */
export function getRateLimitStore(): RateLimitStore {
  if (defaultStore) return defaultStore

  if (
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY)
  ) {
    try {
      // createAdminClient() throws if the service-role env vars are missing,
      // which is what keeps us on the in-memory store outside production.
      defaultStore = new SupabaseRateLimitStore(createAdminClient())
      return defaultStore
    } catch {
      // fall through to memory store
    }
  }

  defaultStore = new MemoryRateLimitStore()
  return defaultStore
}

/** Resets the singleton (used by tests). */
export function resetRateLimitStore(): void {
  defaultStore = null
}
