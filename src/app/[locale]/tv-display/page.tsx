'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket, Establishment, Queue } from '@/types'
import { Volume2, VolumeX, Clock, Users, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TVDisplayPage() {
  const t = useTranslations('tv_display')
  const [code, setCode] = useState('')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notFound, setNotFound] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const supabase = createClientComponentClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const soundEnabledRef = useRef(soundEnabled)
  const knownCalledIdsRef = useRef<Set<string>>(new Set())
  const initialLoadDoneRef = useRef(false)

  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const playChimeAndAnnounce = useCallback((ticketNumbers: string[]) => {
    if (!soundEnabledRef.current || typeof window === 'undefined') return

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        const audioCtx = new AudioCtx()
        const notes = [523.25, 659.25, 783.99] // C5, E5, G5 chime
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.connect(audioCtx.destination)
          gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.12)
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.5)
          osc.start(audioCtx.currentTime + i * 0.12)
          osc.stop(audioCtx.currentTime + i * 0.12 + 0.5)
        })
      }
    } catch {
      // Audio context can fail if autoplay policy blocks before interaction
    }

    if ('speechSynthesis' in window && ticketNumbers.length > 0) {
      try {
        const text = ticketNumbers.map(num => `Senha ${num}`).join('. ')
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'pt-BR'
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
      } catch {
        // Speech synthesis fallback
      }
    }
  }, [])

  const loadEstablishment = useCallback(async (slug: string) => {
    setNotFound(false)
    const { data: est, error } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error || !est) {
      setNotFound(true)
      setEstablishment(null)
      return null
    }
    setEstablishment(est)
    return est
  }, [supabase])

  const loadQueues = useCallback(async (estId: string) => {
    const { data: queueData } = await supabase
      .from('queues')
      .select('*')
      .eq('establishment_id', estId)
      .eq('is_active', true)

    if (queueData) {
      setQueues(queueData as Queue[])
      return queueData
    }
    return []
  }, [supabase])

  const loadTickets = useCallback(async (estId: string) => {
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
        const currentCalled = ticketData.filter(t => t.status === 'called')
        const currentCalledIds = new Set(currentCalled.map(t => t.id))

        if (initialLoadDoneRef.current) {
          const newlyCalled = currentCalled.filter(t => !knownCalledIdsRef.current.has(t.id))
          if (newlyCalled.length > 0) {
            playChimeAndAnnounce(newlyCalled.map(t => t.ticket_number))
          }
        } else {
          initialLoadDoneRef.current = true
        }

        knownCalledIdsRef.current = currentCalledIds
        setTickets(ticketData)
      }
    }
  }, [supabase, playChimeAndAnnounce])

  useEffect(() => {
    if (!code) return

    let cancelled = false
    initialLoadDoneRef.current = false
    knownCalledIdsRef.current = new Set()
    queueMicrotask(() => setConnecting(true))

    const setup = async () => {
      const est = await loadEstablishment(code)
      if (cancelled || !est) {
        setConnecting(false)
        return
      }

      await Promise.all([
        loadQueues(est.id),
        loadTickets(est.id),
      ])

      if (cancelled) {
        setConnecting(false)
        return
      }
      setConnecting(false)

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
  }, [code, loadEstablishment, loadQueues, loadTickets, supabase])

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
              onKeyDown={(e) => e.key === 'Enter' && code && setCode(code)}
              placeholder="MERCADO01"
              aria-label={t('title')}
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

  if (notFound && !connecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 shadow-2xl animate-scale-in">
          <div className="w-20 h-20 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl" aria-hidden="true">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('not_found_title', { default: 'Estabelecimento não encontrado' })}</h1>
          <p className="text-white/70 mb-6">{t('not_found_desc', { default: 'Verifique o código e tente novamente.' })}</p>
          <button
            onClick={() => { setCode(''); setNotFound(false) }}
            className="w-full py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-white/90 transition"
          >
            {t('try_again', { default: 'Tentar novamente' })}
          </button>
        </div>
      </div>
    )
  }

  if (connecting || !establishment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white text-xl">{t('connecting', { default: 'Conectando...' })}</p>
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
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
            aria-pressed={soundEnabled}
            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {queues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-white/60">{t('no_queue')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-xl p-6 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-400/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <p className="text-green-300 text-xl font-semibold">{t('call')}</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {called.map(ticket => (
                          <div key={ticket.id} className="bg-green-400/20 rounded-xl px-8 py-4 animate-bounce">
                            <p className="text-6xl font-bold text-green-400">
                              {ticket.ticket_number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {serving.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/40 rounded-xl p-4 mb-6">
                      <p className="text-yellow-300 text-lg mb-3 font-medium">{t('serving')}</p>
                      <div className="flex flex-wrap gap-3">
                        {serving.map(ticket => (
                          <div key={ticket.id} className="bg-yellow-400/15 rounded-xl px-6 py-3">
                            <p className="text-4xl font-bold text-yellow-400">
                              {ticket.ticket_number}
                            </p>
                          </div>
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
                           className={cn(
                             'flex justify-between items-center py-2 px-3 rounded-lg',
                             i === 0
                                ? 'bg-white/10 border border-white/20'
                                : 'bg-white/5'
                           )}
                         >
                           <span className={cn(
                             'text-xl font-mono font-bold',
                             i === 0 ? 'text-white' : 'text-white/60'
                           )}>
                             {ticket.ticket_number}
                           </span>
                           <span className={cn(
                             'text-sm font-medium',
                             i === 0 ? 'text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full' : 'text-white/40'
                           )}>
                             {i === 0 ? t('now') : `+${i + 1}`}
                           </span>
                         </div>
                       ))}
                      {waiting.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-white/30 text-sm">
                            {t('no_queue')}
                          </p>
                        </div>
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
