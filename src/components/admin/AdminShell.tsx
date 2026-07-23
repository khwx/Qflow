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
  Menu,
  Sun,
  Moon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useDarkMode } from '@/contexts/DarkModeContext'

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
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
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
      <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-gray-700">
        <QrCode className="h-8 w-8 text-indigo-600" />
        <span className="text-xl font-bold text-gray-900 dark:text-white">QFlow</span>
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
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="font-medium">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={async () => { await signOut(); window.location.href = '/' }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{user ? 'Sair' : 'Exit'}</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-6 w-6 text-gray-700 dark:text-gray-300" /> : <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />}
        </button>
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-indigo-600" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">QFlow</span>
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
          'fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-200 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto md:block',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="md:hidden flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <main className="md:ml-0 min-h-screen">
        {establishment && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 px-4 sm:px-8 py-2 flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-indigo-800 dark:text-indigo-300 font-medium">{establishment.name}</span>
            <Link
              href="/admin/establishments"
              className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
            >
              Alterar
            </Link>
          </div>
        )}

        <header className="hidden md:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
