import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from './i18n/config'

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
})

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')
  const isTvDisplay = pathname.startsWith('/tv-display')
  const hasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  if (isAdminRoute) {
    return NextResponse.next()
  }

  if (!isApiRoute && !isTvDisplay && !hasLocale) {
    return handleI18nRouting(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
