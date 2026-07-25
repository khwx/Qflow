'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      router.push('/auth/login')
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error(t('password_mismatch'))
      setLoading(false)
      return
    }

    const { error } = await updatePassword(password)
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(t('password_updated', { default: 'Password updated successfully!' }))
    router.push('/auth/login')
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('reset_title', { default: 'Reset Password' })}</h1>
          <p className="text-white/80">{t('reset_subtitle', { default: 'Enter your new password below.' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-scale-in" style={{ animationDelay: '100ms' }}>
           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               {t('password')}
             </label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input
                 type={showPassword ? 'text' : 'password'}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder={t('password_placeholder')}
                 className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                 required
                 minLength={6}
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
               >
                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
               </button>
             </div>
           </div>

           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               {t('confirm_password')}
             </label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input
                 type={showPassword ? 'text' : 'password'}
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 placeholder={t('password_placeholder')}
                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                 required
                 minLength={6}
               />
             </div>
           </div>

           <button
             type="submit"
             disabled={loading || !password || !confirmPassword}
             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
           >
             {loading ? t('loading') : t('update_password', { default: 'Update Password' })}
           </button>
         </form>
      </div>
    </div>
  )
}
