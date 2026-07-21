import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { Geist } from 'next/font/google'
import { locales, localeNames } from '@/i18n/config'
import { AuthProvider } from '@/contexts/AuthContext'
import '../globals.css'

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const dynamic = 'force-dynamic'

const localizedMetadata: Record<string, { title: string; description: string }> = {
  pt: {
    title: 'QFlow - Sistema de Fila Virtual',
    description: 'Fila virtual com QR Code e gamificação. Elimine as filas de espera e engaje seus clientes.',
  },
  en: {
    title: 'QFlow - Virtual Queue System',
    description: 'QR Code-based virtual queue with gamification. Eliminate waiting lines and engage customers.',
  },
  es: {
    title: 'QFlow - Sistema de Cola Virtual',
    description: 'Cola virtual con código QR y gamificación. Elimine las filas de espera y atraiga a sus clientes.',
  },
  fr: {
    title: 'QFlow - Système de File Virtuelle',
    description: 'File d\'attente virtuelle avec QR Code et gamification. Éliminez les files d\'attente et fidélisez vos clients.',
  },
  de: {
    title: 'QFlow - Virtuelles Warteschlangensystem',
    description: 'Virtuelle Warteschlange mit QR-Code und Gamification. Eliminieren Sie Wartezeiten und binden Sie Ihre Kunden.',
  },
  it: {
    title: 'QFlow - Sistema di Coda Virtuale',
    description: 'Coda virtuale con QR Code e gamification. Elimina le file d\'attesa e coinvolgi i tuoi clienti.',
  },
  ar: {
    title: 'QFlow - نظام الطابور الافتراضي',
    description: 'طابور افتراضي برمز QR وتلعيب. القضاء على خطوط الانتظار وجذب العملاء.',
  },
  zh: {
    title: 'QFlow - 虚拟排队系统',
    description: '基于二维码的虚拟排队与游戏化。消除等待排队并吸引顾客。',
  },
  ja: {
    title: 'QFlow - バーティル待ち行列システム',
    description: 'QRコードベースの情報キューとゲーミフィケーション。待ち時間ををなくし、顧客を引き付けます。',
  },
  ko: {
    title: 'QFlow - 가상 대기열 시스템',
    description: 'QR 코드 기반 가상 대기열과 게이미피케이션. 대기 열을 없애고 고객을 참여시키세요.',
  },
  hi: {
    title: 'QFlow - वर्चुअल क्यू सिस्टम',
    description: 'QR कोड आधारित वर्चुअल क्यू और गेलेक्ट्रि-सिस्टम। प्रतीक्षा पंक्तियों को समाप्त करें और ग्राहकों को जोड़ें।',
  },
  ru: {
    title: 'QFlow - Виртуальная очередь',
    description: 'Виртуальная очередь на основе QR-кода с геймификацией. Устраните ожидание и привлеките клиентов.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const localized = localizedMetadata[locale] ?? localizedMetadata.en

  return {
    title: localized.title,
    description: localized.description,
    openGraph: {
      title: localized.title,
      description: localized.description,
      locale: `${locale}_${locale.toUpperCase()}`,
    },
    twitter: {
      title: localized.title,
      description: localized.description,
    },
  }
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
        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster position="top-center" />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
