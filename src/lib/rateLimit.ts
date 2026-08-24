import { NextResponse } from 'next/server'
import {
  getRateLimitStore,
  resetRateLimitStore,
  MemoryRateLimitStore,
  type RateLimitBucket,
  type RateLimitStore,
} from './rateLimitStore'

// Per-process fallback used only when the configured shared store throws, so a
// transient backend error never blocks legitimate traffic.
const fallbackStore = new MemoryRateLimitStore()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export interface RateLimitOptions {
  windowMs?: number
  max?: number
  keyPrefix?: string
  /** Inject a custom store (used by tests). Defaults to the app-wide store. */
  store?: RateLimitStore
}

export interface RateLimitResult {
  response: NextResponse | null
  remaining: number
  resetAt: number
}

export async function rateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000
  const max = options.max ?? 60
  const prefix = options.keyPrefix ?? 'api'
  const key = `${prefix}:${getClientIp(request)}`

  const now = Date.now()
  const store = options.store ?? getRateLimitStore()

  let bucket: RateLimitBucket | null = null
  try {
    bucket = await store.get(key)
  } catch {
    bucket = await fallbackStore.get(key)
  }

  if (!bucket || bucket.resetAt <= now) {
    const created: RateLimitBucket = {
      count: 1,
      resetAt: now + windowMs,
      createdAt: now,
    }
    try {
      await store.set(key, created)
    } catch {
      await fallbackStore.set(key, created)
    }
    return {
      response: null,
      remaining: max - 1,
      resetAt: created.resetAt,
    }
  }

  if (bucket.count >= max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    const response = NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(bucket.resetAt),
        },
      }
    )
    return { response, remaining: 0, resetAt: bucket.resetAt }
  }

  const updated: RateLimitBucket = { ...bucket, count: bucket.count + 1 }
  try {
    await store.set(key, updated)
  } catch {
    await fallbackStore.set(key, updated)
  }
  return {
    response: null,
    remaining: max - updated.count,
    resetAt: updated.resetAt,
  }
}

export function clearRateLimitBuckets(): void {
  fallbackStore.clear()
  resetRateLimitStore()
}
