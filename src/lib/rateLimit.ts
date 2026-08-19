import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number; createdAt: number }

const buckets = new Map<string, Bucket>()

// Bound memory: never hold more than this many buckets. When exceeded (or every
// SWEEP_INTERVAL_MS), expired buckets are reclaimed and, if still over the cap,
// the oldest entries are dropped.
const MAX_BUCKETS = 10_000
const SWEEP_INTERVAL_MS = 60_000

let lastSweep = 0

function sweep(now: number): void {
  if (buckets.size === 0) {
    lastSweep = now
    return
  }
  const due = now - lastSweep >= SWEEP_INTERVAL_MS
  if (!due && buckets.size <= MAX_BUCKETS) return

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  lastSweep = now

  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS
    const oldest = [...buckets.entries()]
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .slice(0, excess)
      .map(([key]) => key)
    for (const key of oldest) buckets.delete(key)
  }
}

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
}

export interface RateLimitResult {
  response: NextResponse | null
  remaining: number
  resetAt: number
}

export function rateLimit(
  request: Request,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60_000
  const max = options.max ?? 60
  const prefix = options.keyPrefix ?? 'api'
  const key = `${prefix}:${getClientIp(request)}`

  const now = Date.now()
  sweep(now)
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs, createdAt: now })
    return {
      response: null,
      remaining: max - 1,
      resetAt: now + windowMs,
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

  bucket.count += 1
  return {
    response: null,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
  }
}

export function clearRateLimitBuckets(): void {
  buckets.clear()
  lastSweep = 0
}
