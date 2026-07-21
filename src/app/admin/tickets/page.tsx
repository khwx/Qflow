'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Check, X, Search, Play } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function TicketsContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (estSlug) {
      supabase
        .from('establishments')
        .select('*')
        .eq('slug', estSlug)
        .single()
        .then(({ data }) => {
          setEstablishment(data)
          if (data) loadTickets(data.id)
        })
    } else {
      setLoading(false)
    }
  }, [estSlug])

  useEffect(() => {
    if (establishment) {
      loadTickets(establishment.id)
    }
  }, [filter, establishment])

  const loadTickets = async (establishmentId: string) => {
    setLoading(true)
    let query = supabase
      .from('tickets')
      .select('*, queues!inner(establishment_id, name)')
      .eq('queues.establishment_id', establishmentId)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query

    if (data) {
      let filtered = data
      if (search) {
        filtered = data.filter((t: any) =>
          t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
          t.customer_name?.toLowerCase().includes(search.toLowerCase())
        )
      }
      setTickets(filtered)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: Ticket['status']) => {
    const statusLabels: Record<string, string> = {
      waiting: 'Aguardando',
      called: 'Chamado',
      serving: 'Em atendimento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }

    const { error } = await supabase
      .from('tickets')
      .update({ 
        status,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        ...(status === 'called' ? { called_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)

    if (error) {
      toast.error(error.message || 'Erro ao alterar status')
      return
    }

    toast.success(`Status alterado para "${statusLabels[status]}"`)
    if (establishment) loadTickets(establishment.id)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      waiting: 'bg-blue-100 text-blue-700',
      called: 'bg-green-100 text-green-700',
      serving: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels = {
      waiting: 'Aguardando',
      called: 'Chamado',
      serving: 'Em atendimento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return <div className="animate-pulse">Carregando...</div>
  }

  if (!estSlug || !establishment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Nenhum estabelecimento selecionado</p>
        <Link
          href="/admin/establishments"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Selecionar estabelecimento
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Senhas</h2>
          <p className="text-gray-600">Gerencie todas as senhas de {establishment.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por senha ou nome..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os status</option>
            <option value="waiting">Aguardando</option>
            <option value="called">Chamados</option>
            <option value="completed">Concluídos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Senha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fila
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Criado em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket: any) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg font-bold text-indigo-600">
                    {ticket.ticket_number}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.queues?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.customer_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(ticket.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {ticket.status === 'waiting' && (
                      <button
                        onClick={() => updateStatus(ticket.id, 'called')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Chamar"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {ticket.status === 'called' && (
                      <button
                        onClick={() => updateStatus(ticket.id, 'serving')}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Iniciar atendimento"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {(ticket.status === 'called' || ticket.status === 'serving') && (
                      <button
                        onClick={() => updateStatus(ticket.id, 'completed')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Concluir"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {(ticket.status === 'waiting' || ticket.status === 'called') && (
                      <button
                        onClick={() => updateStatus(ticket.id, 'cancelled')}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tickets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma senha encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <TicketsContent />
    </Suspense>
  )
}
