import { describe, it, expect } from 'vitest'
import { getSecurityHeaders } from './securityHeaders'

function headerValue(
  headers: { key: string; value: string }[],
  key: string
): string | undefined {
  return headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value
}

describe('getSecurityHeaders', () => {
  it('includes the core hardening headers', () => {
    const headers = getSecurityHeaders()
    expect(headerValue(headers, 'X-Content-Type-Options')).toBe('nosniff')
    expect(headerValue(headers, 'X-Frame-Options')).toBe('SAMEORIGIN')
    expect(headerValue(headers, 'Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    )
    expect(headerValue(headers, 'X-DNS-Prefetch-Control')).toBe('on')
    expect(headerValue(headers, 'Strict-Transport-Security')).toContain(
      'max-age=63072000'
    )
    expect(headerValue(headers, 'Permissions-Policy')).toContain('camera=()')
  })

  it('emits a Content-Security-Policy', () => {
    const csp = headerValue(getSecurityHeaders(), 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('frame-ancestors')
  })

  it('restricts connect-src to self when no supabase host is set', () => {
    const csp = headerValue(getSecurityHeaders(), 'Content-Security-Policy')!
    expect(csp).toContain('connect-src ' + "'self'")
    expect(csp).not.toContain('wss://')
  })

  it('allows the supabase origin and websocket host when provided', () => {
    const csp = headerValue(
      getSecurityHeaders({ supabaseHost: 'db.example.com' }),
      'Content-Security-Policy'
    )!
    expect(csp).toContain('https://db.example.com')
    expect(csp).toContain('wss://db.example.com')
  })

  it('always returns a non-empty header list', () => {
    expect(getSecurityHeaders().length).toBeGreaterThan(0)
  })
})
