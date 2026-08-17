import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

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
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
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
}
