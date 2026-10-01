'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AdminSections, getSectionFromPath } from '@/components/admin/AdminSections'

function AdminRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const estSlug = searchParams.get('est')

  useEffect(() => {
    const section = getSectionFromPath(pathname)
    const saved = estSlug || (typeof window !== 'undefined' ? localStorage.getItem('qflow_admin_est') : null)

    if (!section) {
      if (saved) {
        router.replace(`/admin/dashboard?est=${encodeURIComponent(saved)}`)
      } else {
        router.replace('/admin/establishments')
      }
    }
  }, [pathname, estSlug, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
}

function DynamicAdminContent() {
  const pathname = usePathname()
  const sectionKey = getSectionFromPath(pathname)
  const [activeSection, setActiveSection] = useState<keyof typeof AdminSections | null>(sectionKey)

  useEffect(() => {
    if (sectionKey) {
      queueMicrotask(() => setActiveSection(sectionKey))
    }
  }, [sectionKey])

  if (!activeSection) {
    return <AdminRedirect />
  }

  const SectionComponent = AdminSections[activeSection]

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <SectionComponent />
    </Suspense>
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
      <DynamicAdminContent />
    </Suspense>
  )
}