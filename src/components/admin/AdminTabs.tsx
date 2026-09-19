'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Ticket,
  Gamepad2,
  Settings,
  QrCode,
  Building2,
  Package,
  BarChart3,
  HeartHandshake,
  Star,
  Monitor,
  Headset,
  ClipboardList,
  UtensilsCrossed,
} from 'lucide-react'
import {
  DashboardTab,
  EstablishmentsTab,
  OperatorTab,
  TriageTab,
  QueuesTab,
  TicketsTab,
  OrdersTab,
  MenuTab,
  PollsTab,
  FeedbackTab,
  TvDisplayConfigTab,
  GamesTab,
  CustomersTab,
  SettingsTab,
} from '@/components/admin/tabs'

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'establishments', name: 'Estabelecimentos', icon: Building2 },
  { id: 'operator', name: 'Operador', icon: Headset },
  { id: 'triage', name: 'Triagem', icon: HeartHandshake },
  { id: 'queues', name: 'Filas', icon: Users },
  { id: 'tickets', name: 'Senhas', icon: Ticket },
  { id: 'orders', name: 'Pedidos', icon: Package },
  { id: 'menu', name: 'Cardápio', icon: UtensilsCrossed },
  { id: 'polls', name: 'Enquetes', icon: BarChart3 },
  { id: 'feedback', name: 'Feedback', icon: Star },
  { id: 'tv-display-config', name: 'TV', icon: Monitor },
  { id: 'games', name: 'Jogos', icon: Gamepad2 },
  { id: 'customers', name: 'Clientes', icon: ClipboardList },
  { id: 'settings', name: 'Configurações', icon: Settings },
] as const

type TabId = typeof tabs[number]['id']

const tabComponents: Record<TabId, React.ComponentType<{ estSlug: string | null }>> = {
  dashboard: dynamic(() => Promise.resolve(DashboardTab), { ssr: false }),
  establishments: dynamic(() => Promise.resolve(EstablishmentsTab), { ssr: false }),
  operator: dynamic(() => Promise.resolve(OperatorTab), { ssr: false }),
  triage: dynamic(() => Promise.resolve(TriageTab), { ssr: false }),
  queues: dynamic(() => Promise.resolve(QueuesTab), { ssr: false }),
  tickets: dynamic(() => Promise.resolve(TicketsTab), { ssr: false }),
  orders: dynamic(() => Promise.resolve(OrdersTab), { ssr: false }),
  menu: dynamic(() => Promise.resolve(MenuTab), { ssr: false }),
  polls: dynamic(() => Promise.resolve(PollsTab), { ssr: false }),
  feedback: dynamic(() => Promise.resolve(FeedbackTab), { ssr: false }),
  'tv-display-config': dynamic(() => Promise.resolve(TvDisplayConfigTab), { ssr: false }),
  games: dynamic(() => Promise.resolve(GamesTab), { ssr: false }),
  customers: dynamic(() => Promise.resolve(CustomersTab), { ssr: false }),
  settings: dynamic(() => Promise.resolve(SettingsTab), { ssr: false }),
}

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )
}

export function AdminTabs({ estSlug }: { estSlug: string | null }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const ActiveComponent = tabComponents[activeTab]

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-gray-700">
          <QrCode className="h-8 w-8" style={{ color: '#6C63FF' }} />
          <span className="logo-stitch text-xl">Qflow</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left',
                activeTab === tab.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <tab.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium truncate">{tab.name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {estSlug && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 px-4 sm:px-8 py-2 flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-indigo-800 dark:text-indigo-300 font-medium">Estabelecimento selecionado</span>
          </div>
        )}
        <div className="p-4 sm:p-8 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <ActiveComponent estSlug={estSlug} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}