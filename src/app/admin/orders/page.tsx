'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Order, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Package, Clock, Check, X, RefreshCw } from 'lucide-react'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

import { timeAgo } from '@/lib/utils'

function getStatusBadge(status: string) {
  const styles = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    preparing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    ready: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    delivered: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }
  const labels = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}

function getNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  }
  return flow[current] || null
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
   const [establishment, setEstablishment] = useState<Establishment | null>(null)
   const [orders, setOrders] = useState<any[]>([])
   const [filter, setFilter] = useState('all')
   const [loading, setLoading] = useState(true)
   const [refreshing, setRefreshing] = useState(false)
   const supabase = createClientComponentClient()
   let estLoaded = false

   useEffect(() => {
     if (!estSlug) {
       setLoading(false)
       return
     }

     let cancelled = false
     const init = async () => {
       const { data: est } = await supabase
         .from('establishments')
         .select('*')
         .eq('slug', estSlug)
         .single()

       if (cancelled || !est) return
       setEstablishment(est)
     }
     init()

     return () => { cancelled = true }
   }, [estSlug])

   const loadOrders = async (establishmentId: string, opts?: { background?: boolean }) => {
     const isBg = opts?.background ?? false
     if (!isBg) setLoading(true)
     else setRefreshing(true)
     let query = supabase
       .from('orders')
       .select('*, tickets(ticket_number, customer_name)')
       .eq('establishment_id', establishmentId)
       .order('created_at', { ascending: false })

     if (filter !== 'all') {
       query = query.eq('status', filter)
     }

     try {
       const { data } = await query
       if (data) setOrders(data)
     } catch (error) {
       console.error('Load orders error:', error)
     } finally {
       if (!isBg) setLoading(false)
       else setRefreshing(false)
     }
   }

   useEffect(() => {
     if (!establishment) return
     const id = establishment.id
     setFilter(filter) // trigger via dep
     loadOrders(id)
     const interval = setInterval(() => loadOrders(id, { background: true }), 10000)
     return () => clearInterval(interval)
   }, [establishment, filter])

   const updateStatus = async (orderId: string, newStatus: string) => {
     const statusLabels: Record<string, string> = {
       pending: 'Pendente',
       preparing: 'Preparando',
       ready: 'Pronto',
       delivered: 'Entregue',
       cancelled: 'Cancelado',
     }

     setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

     const { error } = await supabase
       .from('orders')
       .update({ status: newStatus, updated_at: new Date().toISOString() })
       .eq('id', orderId)

     if (error) {
       toast.error(error.message || 'Erro ao alterar status')
       return
     }

     toast.success(`Status alterado para ${statusLabels[newStatus]}`)
   }

   if (loading && !establishment) {
     return <DashboardSkeleton />
   }

  if (!estSlug || !establishment) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nenhum estabelecimento selecionado</p>
        <Link
          href="/admin/establishments"
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
        >
          Selecionar estabelecimento
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todos os pedidos de {establishment.name}</p>
        </div>
        <button
          onClick={() => loadOrders(establishment.id)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:scale-105"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Pronto</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Senha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Itens</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Horário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order: any) => {
              const ticket = order.tickets as { ticket_number: string; customer_name: string | null } | null
              const itemsSummary = order.items?.map((item: Order['items'][0]) => `${item.name} x${item.quantity}`).join(', ') || '—'
              const nextStatus = getNextStatus(order.status)
              const canCancel = order.status !== 'delivered' && order.status !== 'cancelled'

              return (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {ticket?.ticket_number || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ticket?.customer_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate" title={itemsSummary}>
                    {itemsSummary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {timeAgo(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {nextStatus && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus)}
                          className="px-2.5 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          title="Avançar para próximo status"
                        >
                          → Avançar
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="Cancelar pedido"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
