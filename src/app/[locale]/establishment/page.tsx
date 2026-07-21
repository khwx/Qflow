'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
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
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedEstablishment | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('establishments')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        category,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating establishment:', error)
      toast.error(error.message || t('error_creating'))
      setLoading(false)
      return
    }

    setCreated({ id: data.id, name: data.name, slug: data.slug })
    setLoading(false)
  }

  if (created) {
    const enterUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/enter?code=${created.slug}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('success_title')}</h1>
            <p className="text-gray-600 mb-6">{t('success_desc')}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">{t('name_label')}</p>
              <p className="font-semibold text-gray-900">{created.name}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">{t('slug_display')}</p>
              <p className="font-mono text-lg font-bold text-indigo-600">{created.slug}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 flex justify-center">
              <QRCodeSVG value={enterUrl} size={180} />
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/qr/${created.slug}`}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {t('show_qr')}
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  window.location.href = `/admin/dashboard?est=${created.id}`
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-white/80">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('slug_label')}
            </label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={t('slug_placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('slug_hint')}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? t('creating') : t('create')}
          </button>
        </form>
      </div>
    </div>
  )
}
