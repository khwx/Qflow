'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket } from '@/types'
import { Volume2, VolumeX } from 'lucide-react'

export default function TVDisplayPage() {
  const t = useTranslations('tv_display')
  const [code, setCode] = useState('')
  const [establishment, setEstablishment] = useState<any>(null)
  const [queues, setQueues] = useState<any[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!code) return

    loadData()
    const interval = setInterval(loadData, 2000)

    return () => clearInterval(interval)
  }, [code])

  const loadData = async () => {
    const { data: est } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', code.toLowerCase())
      .eq('is_active', true)
      .single()

    if (est) {
      setEstablishment(est)

      const { data: queueData } = await supabase
        .from('queues')
        .select('*')
        .eq('establishment_id', est.id)
        .eq('is_active', true)

      if (queueData) {
        setQueues(queueData)

        const queueIds = queueData.map(q => q.id)
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*')
          .in('queue_id', queueIds)
          .in('status', ['waiting', 'called', 'serving'])
          .order('created_at')

        if (ticketData) {
          setTickets(ticketData)
        }
      }
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-white text-center mb-2">{t('title')}</h1>
          <p className="text-white/80 text-center mb-8">{t('subtitle')}</p>
          
          <div className="bg-white/10 rounded-xl p-6">
            <label className="block text-white text-sm font-medium mb-2">
              {t('code_label')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX: MERCADO01"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 uppercase tracking-wider text-center text-2xl font-bold"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl">{t('no_queue')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <header className="p-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">{establishment.name}</h1>
          <p className="text-white/80 text-xl">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>
      </header>

      <main className="p-8">
        {queues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-white/60">{t('no_queue')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {queues.map((queue) => {
              const queueTickets = tickets.filter(ticket => ticket.queue_id === queue.id)
              const waiting = queueTickets.filter(ticket => ticket.status === 'waiting')
              const called = queueTickets.filter(ticket => ticket.status === 'called')
              const serving = queueTickets.filter(ticket => ticket.status === 'serving')

              return (
                <div key={queue.id} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-6">{queue.name}</h2>

                  {called.length > 0 && (
                    <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-6 mb-6 animate-pulse">
                      <p className="text-green-300 text-lg mb-2">🚨 {t('call')}</p>
                      {called.map(ticket => (
                        <p key={ticket.id} className="text-5xl font-bold text-green-400">
                          {ticket.ticket_number}
                        </p>
                      ))}
                    </div>
                  )}

                  {serving.length > 0 && (
                    <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-4 mb-6">
                      <p className="text-yellow-300 text-lg mb-2">{t('serving')}</p>
                      {serving.map(ticket => (
                        <p key={ticket.id} className="text-3xl font-bold text-yellow-400">
                          {ticket.ticket_number}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/80 mb-3">{t('next_tickets')}</p>
                    <div className="space-y-2">
                      {waiting.slice(0, 5).map((ticket, i) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center py-2 border-b border-white/10 last:border-0"
                        >
                          <span className="text-2xl font-mono">{ticket.ticket_number}</span>
                          <span className="text-white/60">
                            {i === 0 ? t('now') : `+${i + 1}`}
                          </span>
                        </div>
                      ))}
                      {waiting.length === 0 && (
                        <p className="text-white/40 text-center py-4">
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

      <footer className="p-8 text-center">
        <p className="text-white/40">
          {t('updated')}
        </p>
      </footer>
    </div>
  )
}
