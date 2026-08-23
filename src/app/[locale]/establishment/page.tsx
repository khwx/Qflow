'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { QrCode, Building2, CheckCircle2, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface CreatedEstablishment {
  id: string
  name: string
  slug: string
}

export default function CreateEstablishmentPage() {
  const t = useTranslations('establishment')
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedEstablishment | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error(t('auth_required') || 'Precisas fazer login para criar um estabelecimento')
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/establishments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, slug, category }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // 409 duplicate -> sugere slug alternativo e atualiza input
        if (res.status === 409 && body.suggestedSlug) {
          setSlug(body.suggestedSlug)
          toast.error(`${body.error}. Sugestão: ${body.suggestedSlug}`)
        } else if (res.status === 400 && body.issues) {
          toast.error(body.issues.map((i: { message: string }) => i.message).join(', '))
        } else {
          // Mensagem amigável para 23505 que escapou
          const msg = (body.error as string) || ''
          if (msg.includes('duplicate') || msg.includes('slug')) {
            toast.error('Já existe um estabelecimento com esse identificador. Tenta outro slug.')
          } else {
            toast.error(msg || t('error_creating'))
          }
        }
        return
      }
      setCreated({ id: body.id, name: body.name, slug: body.slug })
    } catch (err) {
      console.error('Error creating establishment:', err)
      toast.error(t('error_creating'))
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    const enterUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/enter?code=${created.slug}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('success_title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('success_desc')}</p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('name_label')}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{created.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-1">{t('slug_display')}</p>
              <p className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">{created.slug}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 flex justify-center">
              <QRCodeSVG value={enterUrl} size={180} />
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/qr/${created.slug}`}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95"
              >
                {t('show_qr')}
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  window.location.href = `/admin/dashboard?est=${created.slug}`
                }}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition hover:scale-105 active:scale-95"
              >
                {t('go_dashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-white/80">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('name_label')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
              }}
              placeholder={t('name_placeholder')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('slug_label')}
            </label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={t('slug_placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase transition"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('slug_hint')}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
            >
              <option value="general">{t('cat_general')}</option>
              <option value="restaurant">{t('cat_restaurant')}</option>
              <option value="clinic">{t('cat_clinic')}</option>
              <option value="retail">{t('cat_retail')}</option>
              <option value="bank">{t('cat_bank')}</option>
              <option value="government">{t('cat_government')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? t('creating') : t('create')}
          </button>
        </form>
      </div>
    </div>
  )
}
