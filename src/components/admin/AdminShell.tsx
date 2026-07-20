'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Gamepad2, 
  Settings, 
  QrCode,
  LogOut,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Estabelecimentos', href: '/admin/establishments', icon: Building2 },
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Filas', href: '/admin/queues', icon: Users },
  { name: 'Senhas', href: '/admin/tickets', icon: Ticket },
  { name: 'Jogos', href: '/admin/games', icon: Gamepad2 },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center gap-2 p-6 border-b">
          <QrCode className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">QFlow</span>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </Link>
        </div>
      </aside>

      <main className="ml-64">
        <header className="bg-white shadow-sm border-b">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === pathname)?.name || 'Admin'}
            </h1>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
