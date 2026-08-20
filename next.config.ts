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

const securityHeaders = getSecurityHeaders({ supabaseHost: supabaseHost() })

export default withNextIntl({
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
})
