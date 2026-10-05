import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from './i18n/config'
import { getSecurityHeaders } from './lib/securityHeaders'

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
})

function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')
  const hasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  // Generate nonce for CSP (Next.js experimental.scriptNonce not available in this version)
  const nonce = generateNonce()
  const allowUnsafeEval = process.env.NODE_ENV !== 'production'

  // Build security headers with nonce
  const securityHeaders = getSecurityHeaders({
    supabaseHost: supabaseHost(),
    allowUnsafeEval,
    nonce,
  })

  if (isAdminRoute) {
    const response = NextResponse.next()
    securityHeaders.forEach((header) => {
      response.headers.set(header.key, header.value)
    })
    // Pass nonce to response for inline scripts that need it
    response.headers.set('x-csp-nonce', nonce)
    return response
  }

  if (!isApiRoute && !hasLocale) {
    const response = handleI18nRouting(request)
    securityHeaders.forEach((header) => {
      response.headers.set(header.key, header.value)
    })
    response.headers.set('x-csp-nonce', nonce)
    return response
  }

  const response = NextResponse.next()
  securityHeaders.forEach((header) => {
    response.headers.set(header.key, header.value)
  })
  response.headers.set('x-csp-nonce', nonce)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
