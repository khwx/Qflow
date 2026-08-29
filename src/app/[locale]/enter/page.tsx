'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { QrCode, Search } from 'lucide-react'

export default function EnterPage() {
  const t = useTranslations('enter')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      router.push(`/queue/${urlCode.toUpperCase()}`)
    }
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault?.()
    const trimmed = code.trim()
    if (!trimmed) {
      toast.error(t('code_empty') || 'Digite um código para continuar')
      return
    }

    setLoading(true)
    router.push(`/queue/${trimmed.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-white/80">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('code_label')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('code_placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                maxLength={10}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? t('searching') : t('button')}
          </button>
        </form>
      </div>
    </div>
  )
}
