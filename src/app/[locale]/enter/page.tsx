'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import toast from 'react-hot-toast'
import { QrCode, Search, MapPin } from 'lucide-react'

export default function EnterPage() {
  const t = useTranslations('enter')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <QrCode className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-white/80">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('code_label')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('code_placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider"
                maxLength={10}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? t('searching') : t('button')}
          </button>
        </form>
      </div>
    </div>
  )
}
