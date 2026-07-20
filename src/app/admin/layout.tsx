import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin | QFlow',
  description: 'QFlow administration panel — manage queues, panels, and settings.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
