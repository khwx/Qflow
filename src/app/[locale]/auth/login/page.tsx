'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useLocale } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(t('login_success'))
    localStorage.setItem('locale', locale)

    const redirect = new URLSearchParams(window.location.search).get('redirect')
    window.location.href = redirect || '/admin/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogIn className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{t('login_title')}</h1>
          <p className="text-white/80">{t('login_subtitle')}</p>
        </div>

         <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-scale-in">
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

           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               {t('password')}
             </label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder={t('password_placeholder')}
                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                 required
               />
             </div>
           </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? t('loading') : t('login_button')}
            </button>

           <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              {t('no_account')}{' '}
              <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                {t('signup_link')}
              </Link>
           </p>
         </form>
      </div>
    </div>
  )
}
