import { type ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function Layout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
