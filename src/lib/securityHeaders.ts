export interface SecurityHeader {
  key: string
  value: string
}

export interface SecurityHeadersOptions {
  supabaseHost?: string | null
}

/**
 * Headers that apply regardless of deployment: protect against clickjacking,
 * MIME sniffing, referrer leakage and opt browsers into HTTPS-only.
 */
const BASE_HEADERS: SecurityHeader[] = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()',
  },
]

/**
 * Builds the security headers applied to every response. When `supabaseHost`
 * is provided the Content-Security-Policy allows the Supabase origin (HTTP +
 * WSS) so the publishable client, Auth and Realtime keep working.
 */
export function getSecurityHeaders(
  options: SecurityHeadersOptions = {}
): SecurityHeader[] {
  const { supabaseHost } = options
  const connectSrc =
    supabaseHost && supabaseHost.length > 0
      ? `'self' https://${supabaseHost} wss://${supabaseHost}`
      : "'self'"

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  return [
    ...BASE_HEADERS,
    { key: 'Content-Security-Policy', value: csp },
  ]
}
