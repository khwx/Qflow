'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Queue, Ticket, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Play, Check, X, Trash2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function QueuesContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newQueue, setNewQueue] = useState({ name: '', description: '', estimated_wait_minutes: 5 })
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
          if (data) loadData(data.id)
        })
    } else {
      setLoading(false)
    }
  }, [estSlug])

  const loadData = async (establishmentId: string) => {
    try {
      const { data: queuesData } = await supabase
        .from('queues')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name')

      if (queuesData) {
        setQueues(queuesData)
        
        const queueIds = queuesData.map(q => q.id)
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .in('queue_id', queueIds)
          .in('status', ['waiting', 'called', 'serving'])
          .order('created_at')

        if (ticketsData) {
          setTickets(ticketsData)
        }
      }
    } catch (error) {
      console.error('Load queues error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.from('queues').insert({
      ...newQueue,
      establishment_id: establishment!.id,
      current_number: 0,
    })

    if (error) {
      toast.error(error.message || 'Erro ao criar fila')
      return
    }

    toast.success('Fila criada com sucesso!')
    setNewQueue({ name: '', description: '', estimated_wait_minutes: 5 })
    setShowForm(false)
    loadData(establishment!.id)
  }

  const callNext = async (queue: Queue) => {
    const nextTicket = tickets.find(t => t.queue_id === queue.id && t.status === 'waiting')
    
    if (nextTicket) {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'called',
          called_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id)

      if (error) {
        toast.error(error.message || 'Erro ao chamar próximo')
        return
      }

      await supabase
        .from('queues')
        .update({ current_number: parseInt(nextTicket.ticket_number.split('-')[1]) })
        .eq('id', queue.id)

      toast.success(`Chamada senha ${nextTicket.ticket_number}`)
      loadData(establishment!.id)
    } else {
      toast.error('Nenhuma senha aguardando nesta fila')
    }
  }

  const completeTicket = async (ticket: Ticket) => {
    await supabase
      .from('tickets')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', ticket.id)

    loadData(establishment!.id)
  }

  const deleteQueue = async (id: string) => {
    const { error } = await supabase.from('queues').delete().eq('id', id)
    if (error) {
      toast.error(error.message || 'Erro ao excluir fila')
      return
    }
    toast.success('Fila excluída com sucesso!')
    loadData(establishment!.id)
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
          <h2 className="text-2xl font-bold text-gray-900">Filas</h2>
          <p className="text-gray-600">Gerencie as filas de {establishment.name}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Nova Fila
        </button>
      </div>

      {showForm && (
        <form onSubmit={createQueue} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Fila
              </label>
              <input
                type="text"
                value={newQueue.name}
                onChange={(e) => setNewQueue({ ...newQueue, name: e.target.value })}
                placeholder="Ex: Caixa Rápido"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={newQueue.description}
                onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })}
                placeholder="Descrição opcional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Médio (min)
              </label>
              <input
                type="number"
                value={newQueue.estimated_wait_minutes}
                onChange={(e) => setNewQueue({ ...newQueue, estimated_wait_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Criar Fila
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {queues.map((queue) => {
          const queueTickets = tickets.filter(t => t.queue_id === queue.id)
          const waiting = queueTickets.filter(t => t.status === 'waiting')
          const called = queueTickets.filter(t => t.status === 'called')
          
          return (
            <div key={queue.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{queue.name}</h3>
                  {queue.description && (
                    <p className="text-sm text-gray-600">{queue.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => callNext(queue)}
                    disabled={waiting.length === 0}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    Chamar Próximo
                  </button>
                  <button
                    onClick={() => deleteQueue(queue.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{waiting.length}</p>
                  <p className="text-sm text-gray-600">Aguardando</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{called.length}</p>
                  <p className="text-sm text-gray-600">Chamados</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{queue.current_number}</p>
                  <p className="text-sm text-gray-600">Última Senha</p>
                </div>
              </div>

              {queueTickets.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Senhas na fila:</p>
                  <div className="flex flex-wrap gap-2">
                    {queueTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`
                          px-3 py-1 rounded-lg text-sm font-medium
                          ${ticket.status === 'waiting' ? 'bg-blue-100 text-blue-700' : ''}
                          ${ticket.status === 'called' ? 'bg-green-100 text-green-700' : ''}
                          ${ticket.status === 'serving' ? 'bg-yellow-100 text-yellow-700' : ''}
                        `}
                      >
                        {ticket.ticket_number}
                        {ticket.status === 'called' && (
                          <button
                            onClick={() => completeTicket(ticket)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <Check className="h-4 w-4 inline" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
           )
        })}
      </div>
    </div>
  )
}

export default function QueuesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <QueuesContent />
    </Suspense>
  )
}
