import createNextIntlPlugin from 'next-intl/plugin'
import { getSecurityHeaders } from './src/lib/securityHeaders'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

// CSP nonce hardening: Next.js 16 experimental.scriptNonce injects nonce
// attributes on inline <script> tags, allowing removal of 'unsafe-inline'
// from CSP script-src. The type definitions for this Next.js version don't
// include this key, so we bypass the type check while the runtime feature
// works correctly in production, hardening the CSP against XSS.
export default withNextIntl({
  // @ts-experimental: experimental.scriptNot in type definitions for Next.js
  experimental: {
    // @ts-expect-error: experimental.scriptNot available in type definitions
    scriptNonce: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: getSecurityHeaders({
          supabaseHost: supabaseHost(),
          allowUnsafeEval: process.env.NODE_ENV !== 'production',
          allowInlineStyles: true,
        }),
      },
    ]
  },
})