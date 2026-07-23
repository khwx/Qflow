'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket } from '@/types'
import { Volume2, VolumeX, Clock, Users, CheckCircle } from 'lucide-react'

export default function TVDisplayPage() {
  const t = useTranslations('tv_display')
  const [code, setCode] = useState('')
  const [establishment, setEstablishment] = useState<any>(null)
  const [queues, setQueues] = useState<any[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const supabase = createClientComponentClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+JkI+Fd2Btf4aRk46EeWd0g4uUk5CKg31ue4OQlZGQiH54dYCLlJOPiYJ+eHuEjpSTkIeBfHh8hY2VlJCGgHx4fYWOlpSRh4B8eX6Gj5aVkYaAfXp/h4+XlpKGgX17f4eQl5eThoF9fH+IkJeYkoWBfn2AiJCYmZOFgX5+gYmRmZqUhYF/f4KJkZqblYSCf4GCiZKbnJWFg3+BgoqTnJ2VhYN/goOLlJ2elYaEf4KDjJWen5aGhX+DhI2Wn6CXh4Z/g4SOl6Cgl4eHf4SEj5mhoZiHiH+FiI+Zo6KZh4h/hYiQmaSjmYeJf4aJkJmlo5qIin+HiZGZpqOaiIt/h4qSmaekeA==')
      audioRef.current.volume = 0.3
    }
  }, [soundEnabled])

  const loadEstablishment = async (slug: string) => {
    const { data: est } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .eq('is_active', true)
      .single()

    if (est) {
      setEstablishment(est)
    }
    return est
  }

  const loadQueues = async (estId: string) => {
    const { data: queueData } = await supabase
      .from('queues')
      .select('*')
      .eq('establishment_id', estId)
      .eq('is_active', true)

    if (queueData) {
      setQueues(queueData)
      return queueData
    }
    return []
  }

  const loadTickets = async (estId: string) => {
    const { data: queueData } = await supabase
      .from('queues')
      .select('id')
      .eq('establishment_id', estId)
      .eq('is_active', true)

    if (queueData && queueData.length > 0) {
      const queueIds = queueData.map(q => q.id)
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*')
        .in('queue_id', queueIds)
        .in('status', ['waiting', 'called', 'serving'])
        .order('created_at')

      if (ticketData) {
        const prevCalled = tickets.filter(t => t.status === 'called').length
        const newCalled = ticketData.filter(t => t.status === 'called').length

        if (newCalled > prevCalled && soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {})
        }

        setTickets(ticketData)
      }
    }
  }

  useEffect(() => {
    if (!code) return

    let cancelled = false

    const setup = async () => {
      const est = await loadEstablishment(code)
      if (cancelled || !est) return

      await Promise.all([
        loadQueues(est.id),
        loadTickets(est.id),
      ])

      if (cancelled) return

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      const channel = supabase
        .channel('tv-tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
          loadTickets(est.id)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
          loadQueues(est.id)
          loadTickets(est.id)
        })
        .subscribe()

      channelRef.current = channel
    }

    setup()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [code])

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-white/70">{t('subtitle')}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MERCADO01"
              className="w-full px-6 py-4 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/40 uppercase tracking-[0.3em] text-center text-3xl font-bold focus:outline-none focus:border-white/60 transition"
              maxLength={10}
              autoFocus
            />
            <button
              onClick={() => code && setCode(code)}
              className="w-full py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-white/90 transition"
            >
              {t('connect', { default: 'Connect' })}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white text-2xl">{t('no_queue')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <header className="p-6 sm:p-8 flex justify-between items-start border-b border-white/10">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-2">{establishment.name}</h1>
          <p className="text-white/60 text-lg">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-white/60" />
            <span className="text-2xl font-mono font-bold">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <main className="p-6 sm:p-8">
        {queues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-white/60">{t('no_queue')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((queue) => {
              const queueTickets = tickets.filter(ticket => ticket.queue_id === queue.id)
              const waiting = queueTickets.filter(ticket => ticket.status === 'waiting')
              const called = queueTickets.filter(ticket => ticket.status === 'called')
              const serving = queueTickets.filter(ticket => ticket.status === 'serving')

              return (
                <div key={queue.id} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{queue.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Users className="h-4 w-4" />
                      <span>{waiting.length} {t('waiting', { default: 'waiting' })}</span>
                    </div>
                  </div>

                  {called.length > 0 && (
                    <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-xl p-6 mb-6 animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                        <p className="text-green-300 text-xl font-semibold">{t('call')}</p>
                      </div>
                      <div className="space-y-2">
                        {called.map(ticket => (
                          <p key={ticket.id} className="text-6xl font-bold text-green-400 animate-bounce">
                            {ticket.ticket_number}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {serving.length > 0 && (
                    <div className="bg-yellow-500/20 border-2 border-yellow-400/50 rounded-xl p-4 mb-6">
                      <p className="text-yellow-300 text-lg mb-3">{t('serving')}</p>
                      <div className="space-y-2">
                        {serving.map(ticket => (
                          <p key={ticket.id} className="text-4xl font-bold text-yellow-400">
                            {ticket.ticket_number}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 mb-3 text-sm font-medium">{t('next_tickets')}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {waiting.slice(0, 8).map((ticket, i) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg"
                        >
                          <span className="text-xl font-mono font-bold">{ticket.ticket_number}</span>
                          <span className={`text-sm font-medium ${i === 0 ? 'text-green-400' : 'text-white/40'}`}>
                            {i === 0 ? t('now') : `+${i + 1}`}
                          </span>
                        </div>
                      ))}
                      {waiting.length === 0 && (
                        <p className="text-white/30 text-center py-4">
                          {t('no_queue')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t border-white/10">
        <p className="text-white/30 text-sm">
          QFlow — {t('updated')} {currentTime.toLocaleTimeString('pt-BR')}
        </p>
      </footer>
    </div>
  )
}
