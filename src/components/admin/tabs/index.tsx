'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Building2 } from 'lucide-react'
import Link from 'next/link'

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )
}

function createTabComponent(title: string, description: string, Icon: React.ComponentType<{ className?: string }>) {
  return function TabContent({ estSlug: _estSlug }: { estSlug: string | null }) {
    const searchParams = useSearchParams()
    const currentEstSlug = searchParams.get('est')

    if (!currentEstSlug) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 max-w-md">
            <Icon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            <Link
              href="/admin/establishments"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:scale-105"
            >
              Selecionar Estabelecimento
            </Link>
          </div>
        </div>
      )
    }

    return (
      <Suspense fallback={<TabSkeleton />}>
        <div className="animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Componente em desenvolvimento. Use a navegação lateral para acessar a página completa.
            </p>
          </div>
        </div>
      </Suspense>
    )
  }
}

export const DashboardTab = createTabComponent(
  'Dashboard',
  'Visão geral das métricas do estabelecimento',
  Building2
)

export const EstablishmentsTab = createTabComponent(
  'Estabelecimentos',
  'Gerencie seus estabelecimentos',
  Building2
)

export const OperatorTab = createTabComponent(
  'Operador',
  'Painel do operador/guichê para chamar e atender senhas',
  Building2
)

export const TriageTab = createTabComponent(
  'Triagem',
  'Gerencie a priorização de senhas em tempo real',
  Building2
)

export const QueuesTab = createTabComponent(
  'Filas',
  'Configure e gerencie filas de atendimento',
  Building2
)

export const TicketsTab = createTabComponent(
  'Senhas',
  'Visualize e gerencie todas as senhas emitidas',
  Building2
)

export const OrdersTab = createTabComponent(
  'Pedidos',
  'Gerencie pedidos e encomendas dos clientes',
  Building2
)

export const MenuTab = createTabComponent(
  'Cardápio',
  'Configure o cardápio de produtos para encomendas',
  Building2
)

export const PollsTab = createTabComponent(
  'Enquetes',
  'Crie e gerencie enquetes para engajamento',
  Building2
)

export const FeedbackTab = createTabComponent(
  'Feedback',
  'Visualize feedback dos clientes',
  Building2
)

export const TvDisplayConfigTab = createTabComponent(
  'TV Display Config',
  'Configure o display de TV para chamada de senhas',
  Building2
)

export const GamesTab = createTabComponent(
  'Jogos',
  'Configure jogos de gamificação para clientes',
  Building2
)

export const CustomersTab = createTabComponent(
  'Clientes',
  'Gerencie clientes fidelizados',
  Building2
)

export const SettingsTab = createTabComponent(
  'Configurações',
  'Configurações gerais do sistema',
  Building2
)