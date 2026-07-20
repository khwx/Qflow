'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { BarChart3, Users, Ticket, TrendingUp, Clock, RefreshCw, QrCode, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Ticket as TicketType } from '@/types'

const REFRESH_INTERVAL = 10000

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `há ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting: 'Aguardando',
    called: 'Chamada',
    serving: 'Atendendo',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    waiting: 'bg-yellow-400',
    called: 'bg-blue-400',
    serving: 'bg-indigo-400',
    completed: 'bg-green-400',
    cancelled: 'bg-red-400',
  }
  return colors[status] || 'bg-gray-400'
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')

  const [stats, setStats] = useState({
    totalTickets: 0,
    waiting: 0,
    completed: 0,
    avgWaitTime: 0,
    todayTickets: 0,
  })
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([])
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadDashboard = useCallback(async () => {
    const supabase = createClientComponentClient()
    const today = new Date().toISOString().split('T')[0]

    let query = supabase.from('tickets').select('*')
    if (estSlug) {
      const { data: est } = await supabase
        .from('establishments')
        .select('id')
        .eq('slug', estSlug)
        .single()
      if (est) query = query.eq('establishment_id', est.id)
    }

    const { data: tickets } = await query.order('created_at', { ascending: false })

    if (tickets) {
      const todayTickets = tickets.filter(t => t.created_at.startsWith(today))
      const waiting = todayTickets.filter(t => t.status === 'waiting').length
      const completed = todayTickets.filter(t => t.status === 'completed').length

      const completedWithTime = todayTickets.filter(
        t => t.status === 'completed' && t.completed_at && t.called_at
      )
      const avgWaitTime =
        completedWithTime.length > 0
          ? Math.round(
              completedWithTime.reduce(
                (sum, t) =>
                  sum + (new Date(t.completed_at!).getTime() - new Date(t.called_at!).getTime()) / 60000,
                0
              ) / completedWithTime.length
            )
          : 0

      setStats({
        totalTickets: tickets.length,
        waiting,
        completed,
        todayTickets: todayTickets.length,
        avgWaitTime,
      })

      const hourCounts: Record<string, number> = {}
      todayTickets.forEach(t => {
        const h = new Date(t.created_at).getHours().toString().padStart(2, '0') + ':00'
        hourCounts[h] = (hourCounts[h] || 0) + 1
      })
      const sortedHours = Object.entries(hourCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, count]) => ({ hour, count }))
      setHourlyData(sortedHours)

      setRecentTickets(tickets.slice(0, 5))
    }

    setLastRefresh(new Date())
    setLoading(false)
  }, [estSlug])

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadDashboard])

  if (!estSlug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum estabelecimento selecionado</h2>
          <p className="text-gray-600 mb-4">
            Acesse o dashboard com o parâmetro <code className="bg-gray-100 px-1 rounded">?est=slug</code> para visualizar os dados.
          </p>
          <Link
            href="/admin/establishments"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Selecionar Estabelecimento
          </Link>
        </div>
      </div>
    )
  }

  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1)

  const statCards = [
    { label: 'Senhas Hoje', value: stats.todayTickets, icon: Ticket, color: 'bg-blue-500' },
    { label: 'Aguardando', value: stats.waiting, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Atendidos', value: stats.completed, icon: Users, color: 'bg-green-500' },
    { label: 'Tempo Médio', value: `${stats.avgWaitTime} min`, icon: TrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/qr/${estSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Link>
        </div>
        <button
          onClick={() => loadDashboard()}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      <p className="text-xs text-gray-400 text-right mb-6">
        Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Atendimentos por Hora</h3>
          {hourlyData.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Nenhum atendimento registrado hoje.</p>
          ) : (
            <div className="space-y-3">
              {hourlyData.map(({ hour, count }) => (
                <div key={hour} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-16">{hour}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${(count / maxHourly) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
          {recentTickets.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Nenhuma atividade recente.</p>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(ticket.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      Senha <span className="font-medium">#{ticket.ticket_number}</span>
                      {' — '}
                      <span className="text-gray-600">{getStatusLabel(ticket.status)}</span>
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo(ticket.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
