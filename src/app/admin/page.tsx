'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')

  useEffect(() => {
    const saved =
      estSlug ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('qflow_admin_est')
        : null)
    if (saved) {
      router.replace(`/admin/dashboard?est=${encodeURIComponent(saved)}`)
    } else {
      router.replace('/admin/establishments')
    }
  }, [estSlug, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <AdminRedirect />
    </Suspense>
  )
}
