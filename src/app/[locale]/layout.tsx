import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { Geist } from 'next/font/google'
import { locales } from '@/i18n/config'
import '../globals.css'

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(locales, locale)) {
    notFound()
  }

  let messages
  try {
    messages = (await import(`@/i18n/messages/${locale}.json`)).default
  } catch {
    notFound()
  }

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
