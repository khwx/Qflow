'use client'

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFoundPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const t = useTranslations('notFound')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="text-center text-white animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 animate-scale-in">404</h1>
        <h2 className="text-2xl font-semibold mb-2 animate-slide-up">{t('title')}</h2>
        <p className="text-lg text-white/80 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>{t('message')}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-white text-indigo-600 font-medium px-6 py-3 rounded-full hover:bg-white/90 transition-colors animate-slide-up hover:scale-105 active:scale-95"
          style={{ animationDelay: '200ms' }}
        >
          {t('go_home')}
        </Link>
      </div>
    </div>
  )
}