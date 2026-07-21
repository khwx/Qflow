'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Ticket,
  Gamepad2,
  Settings,
  QrCode,
  LogOut,
  User,
  Building2,
  Package,
  X,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Estabelecimentos', href: '/admin/establishments', icon: Building2 },
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Filas', href: '/admin/queues', icon: Users },
  { name: 'Senhas', href: '/admin/tickets', icon: Ticket },
  { name: 'Pedidos', href: '/admin/orders', icon: Package },
  { name: 'Jogos', href: '/admin/games', icon: Gamepad2 },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

function AdminShellInner({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (estSlug) {
      supabase
        .from('establishments')
        .select('*')
        .eq('slug', estSlug)
        .single()
        .then(({ data }) => setEstablishment(data))
    } else {
      setEstablishment(null)
    }
  }, [estSlug, supabase])

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 p-6 border-b">
        <QrCode className="h-8 w-8 text-indigo-600" />
        <span className="text-xl font-bold text-gray-900">QFlow</span>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition',
              pathname === item.href
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={async () => { await signOut(); window.location.href = '/' }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{user ? 'Sair' : 'Exit'}</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white shadow-sm border-b sticky top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-indigo-600" />
          <span className="text-lg font-bold text-gray-900">QFlow</span>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-200 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto md:block',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="md:hidden flex items-center justify-end p-4 border-b">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <main className="md:ml-0 min-h-screen">
        {establishment && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 sm:px-8 py-2 flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-800 font-medium">{establishment.name}</span>
            <Link
              href="/admin/establishments"
              className="ml-2 text-indigo-600 hover:text-indigo-800 underline"
            >
              Alterar
            </Link>
          </div>
        )}

        <header className="hidden md:block bg-white shadow-sm border-b">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === pathname)?.name || 'Admin'}
            </h1>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center gap-2 p-6 border-b">
          <QrCode className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">QFlow</span>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>
      <main className="md:ml-64">
        <div className="bg-white shadow-sm border-b">
          <div className="px-8 py-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  )
}
