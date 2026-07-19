'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { BarChart3, Users, Ticket, Gamepad2, TrendingUp, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    waiting: 0,
    completed: 0,
    avgWaitTime: 0,
    todayTickets: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const supabase = createClientComponentClient()
    
    const today = new Date().toISOString().split('T')[0]

    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')

    if (tickets) {
      const todayTickets = tickets.filter(t => 
        t.created_at.startsWith(today)
      )
      
      const waiting = tickets.filter(t => t.status === 'waiting').length
      const completed = tickets.filter(t => t.status === 'completed').length
      
      setStats({
        totalTickets: tickets.length,
        waiting,
        completed,
        todayTickets: todayTickets.length,
        avgWaitTime: 5,
      })
    }
  }

  const statCards = [
    { label: 'Senhas Hoje', value: stats.todayTickets, icon: Ticket, color: 'bg-blue-500' },
    { label: 'Aguardando', value: stats.waiting, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Atendidos', value: stats.completed, icon: Users, color: 'bg-green-500' },
    { label: 'Tempo Médio', value: `${stats.avgWaitTime} min`, icon: TrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div>
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
          <div className="space-y-3">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((hour, i) => (
              <div key={hour} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-16">{hour}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.random() * 80 + 20}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {Math.floor(Math.random() * 20 + 5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            {[
              { action: 'Nova senha criada', time: 'há 2 min', type: 'ticket' },
              { action: 'Senha #003 chamada', time: 'há 5 min', type: 'call' },
              { action: 'Jogo jogado', time: 'há 8 min', type: 'game' },
              { action: 'Pedido realizado', time: 'há 12 min', type: 'order' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
