'use client'

import { AdminTabs } from '@/components/admin/AdminTabs'
import { useSearchParams } from 'next/navigation'

export default function AdminPage() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')

  return <AdminTabs estSlug={estSlug} />
}