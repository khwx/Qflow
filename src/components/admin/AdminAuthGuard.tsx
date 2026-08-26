'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { defaultLocale } from '@/i18n/config'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const savedLocale = typeof window !== 'undefined'
        ? localStorage.getItem('locale') || defaultLocale
        : defaultLocale
      router.replace(`/${savedLocale}/auth/login?redirect=/admin/dashboard`)
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return <>{children}</>
}
