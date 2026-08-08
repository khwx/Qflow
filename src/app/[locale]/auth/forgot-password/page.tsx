'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(res => res.json())

    if (error) {
      toast.error(error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('email_sent_title', { default: 'Check your email' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('email_sent_desc', { default: 'We sent you a password reset link. Please check your inbox.' })}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_login', { default: 'Back to login' })}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('forgot_title', { default: 'Forgot password?' })}</h1>
          <p className="text-white/80">{t('forgot_subtitle', { default: 'Enter your email and we will send you a reset link.' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? t('loading') : t('send_reset_link', { default: 'Send Reset Link' })}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_login', { default: 'Back to login' })}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
