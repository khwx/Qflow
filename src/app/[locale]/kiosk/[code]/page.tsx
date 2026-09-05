'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment, Queue } from '@/types'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { Clock, Users, Ticket as TicketIcon, QrCode, AlertCircle, CheckCircle2, RefreshCw, TabletSmartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function KioskPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { code } = use(params)
  const t = useTranslations('kiosk')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [taking, setTaking] = useState(false)
  const [ticket, setTicket] = useState<{ ticket_number: string; id: string } | null>(null)
  const [countdown, setCountdown] = useState(30)
  const timerRef = useRef<number | null>(null)
  const supabase = createClientComponentClient()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/establishments/${code.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setEstablishment(data.establishment)
        setQueues(data.queues || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [code])

  useEffect(() => { load() }, [load])

  // realtime queues
  useEffect(() => {
    if (!establishment) return
    const ch = supabase.channel(`kiosk-${establishment.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [establishment, supabase, load])

  // auto-reset 30s after ticket
  useEffect(() => {
    if (!ticket) return
    setCountdown(30)
    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setTicket(null)
          setSelectedQueue(null)
          setName('')
          setPhone('')
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ticket])

  // also reset selection after 30s idle without ticket
  useEffect(() => {
    if (!selectedQueue || ticket) return
    const id = window.setTimeout(() => {
      setSelectedQueue(null)
    }, 30000)
    return () => clearTimeout(id)
  }, [selectedQueue, ticket])

  const take = async () => {
    if (!selectedQueue) return
    setTaking(true)
    try {
      const res = await fetch('/api/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: selectedQueue.id, customer_name: name || null, customer_phone: phone || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao gerar senha'); setTaking(false); return }
      setTicket(data)
      toast.success(`Senha ${data.ticket_number}`)
    } catch { toast.error('Erro ao gerar senha') }
    finally { setTaking(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-4" />
          <p className="text-white/70">Carregando totem...</p>
        </div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-center">
        <div>
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-2">Totem — não encontrado</h1>
          <p className="text-white/60">Código “{code}” inválido. Verifique o QR da recepção.</p>
        </div>
      </div>
    )
  }

  // Ticket success screen
  if (ticket) {
    const waitingUrl = typeof window !== 'undefined' ? `${window.location.origin}/pt/waiting/${ticket.id}` : ''
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex flex-col p-4 sm:p-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl p-8 sm:p-10 max-w-xl w-full text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-sm tracking-widest font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sua senha</p>
            <p className="text-6xl sm:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-2">{ticket.ticket_number}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{establishment.name} • {selectedQueue?.name}</p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6 flex flex-col items-center gap-3">
              <QRCodeSVG value={waitingUrl || ticket.ticket_number} size={148} className="rounded-xl bg-white p-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Escaneie para acompanhar a fila no celular</p>
              <p className="text-[11px] font-mono text-gray-400 break-all">{waitingUrl}</p>
            </div>

            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(countdown/30)*100}%` }} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Reiniciando em {countdown}s — toque para voltar agora
            </p>
            <button onClick={()=>{ if(timerRef.current) clearInterval(timerRef.current); setTicket(null); setSelectedQueue(null); }} className="mt-4 w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold">Voltar ao início</button>
          </div>
        </div>
        <div className="text-center text-white/60 text-xs pt-4">QFlow Totem • Toque na tela para interagir • {establishment.slug.toUpperCase()}</div>
      </div>
    )
  }

  const primary = establishment.primary_color || '#4f46e5'
  const secondary = establishment.secondary_color || '#7c3aed'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">
      {/* Header */}
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between border-b border-white/10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
        <div className="flex items-center gap-4">
          {establishment.logo_url ? <img src={establishment.logo_url} alt={establishment.name} className="h-12 w-12 rounded-2xl bg-white/20 object-cover p-1" /> : <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black">{establishment.name[0]}</div>}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-none tracking-tight">{establishment.name}</h1>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-2"><TabletSmartphone className="h-4 w-4" /> Totem de autoatendimento • Toque para retirar sua senha</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 bg-white/15 rounded-2xl px-5 py-3 backdrop-blur">
          <QrCode className="h-7 w-7 text-white/90" />
          <div className="text-left">
            <div className="text-xs text-white/70 leading-none">Código</div>
            <div className="font-mono font-bold text-lg leading-none">{establishment.slug.toUpperCase()}</div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1.35fr_0.85fr] gap-0">
        {/* Left: giant queue buttons */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-950">
          {!selectedQueue ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><TicketIcon className="h-6 w-6 text-white/60" /> Selecione a fila</h2>
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70">{queues.length} filas</span>
              </div>
              {queues.length===0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <Users className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70">Nenhuma fila ativa no momento</p>
                  <p className="text-white/40 text-sm mt-1">Procure um atendente</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {queues.slice(0,3).map((q,i)=> (
                    <button key={q.id} onClick={()=>setSelectedQueue(q)} className={cn('group text-left rounded-[1.75rem] p-6 sm:p-8 border-2 transition hover:scale-[1.01] active:scale-[0.99] shadow-xl', i===0 ? 'bg-white text-gray-900 border-white' : i===1 ? 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/15' : 'bg-white/5 border-white/10 text-white hover:bg-white/10')}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className={cn('inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-3', i===0 ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-white/80')}>Fila {i+1} • toque gigante</div>
                          <div className="text-3xl sm:text-4xl font-black leading-none tracking-tight">{q.name}</div>
                          {q.description && <div className={cn('text-sm mt-2 line-clamp-2', i===0 ? 'text-gray-600' : 'text-white/70')}>{q.description}</div>}
                        </div>
                        <div className={cn('shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black', i===0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-900')}>{i+1}</div>
                      </div>
                      <div className={cn('flex items-center gap-4 mt-5 text-sm', i===0 ? 'text-gray-500' : 'text-white/60')}>
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> ~{q.estimated_wait_minutes || 5} min</span>
                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {q.current_number} atendidos</span>
                      </div>
                    </button>
                  ))}
                  {queues.length>3 && (
                    <div className="grid grid-cols-2 gap-3">
                      {queues.slice(3).map(q=>(
                        <button key={q.id} onClick={()=>setSelectedQueue(q)} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-left hover:bg-white/10 transition">
                          <div className="font-bold text-white">{q.name}</div>
                          <div className="text-xs text-white/60 mt-1 flex items-center gap-2"><Clock className="h-3 w-3" /> ~{q.estimated_wait_minutes || 5} min</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="max-w-lg mx-auto lg:mx-0">
              <button onClick={()=>setSelectedQueue(null)} className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">← Voltar</button>
              <div className="bg-white dark:bg-gray-900 rounded-[1.75rem] p-6 sm:p-8 text-gray-900 dark:text-white shadow-2xl animate-scale-in">
                <h3 className="text-2xl font-black mb-1">{selectedQueue.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{selectedQueue.description || 'Informe seus dados (opcional) e retire sua senha gigante abaixo.'}</p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome (opcional)</span>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" className="mt-1 w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg focus:border-indigo-500 focus:ring-0 outline-none transition" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefone (opcional)</span>
                    <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" className="mt-1 w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg focus:border-indigo-500 focus:ring-0 outline-none transition" />
                  </label>
                  <button onClick={take} disabled={taking} className="w-full py-5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xl font-black tracking-tight hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 shadow-lg">
                    {taking ? 'Gerando...' : '🎟️ Retirar senha gigante'}
                  </button>
                  <p className="text-center text-xs text-gray-400">Ao continuar você aceita entrar na fila virtual</p>
                </div>
              </div>
              <p className="text-center text-white/30 text-xs mt-4">Auto-reset em 30s sem interação</p>
            </div>
          )}
        </div>

        {/* Right: info + QR */}
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 sm:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="flex-1">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><QrCode className="h-5 w-5 text-indigo-600" /> Leve no celular</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 text-center border border-gray-100 dark:border-gray-700">
              <div className="bg-white p-3 rounded-2xl inline-block shadow-sm">
                <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : `https://qflow/${establishment.slug}`} size={180} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Escaneie para entrar pelo celular</p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all">{typeof window !== 'undefined' ? window.location.href : ''}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Totem online • toque rápido
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4">
              <p className="font-semibold text-indigo-900 dark:text-indigo-200 text-sm">Como funciona?</p>
              <ol className="mt-2 space-y-1.5 text-sm text-indigo-700/80 dark:text-indigo-300/80 list-decimal ml-4">
                <li>Toque na fila gigante ao lado</li>
                <li>Digite nome se quiser</li>
                <li>Retire sua senha e aguarde o painel</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>QFlow Kiosk • Tablet fullscreen</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
      </div>

      <footer className="px-6 py-3 text-center text-[11px] text-white/25 bg-black">Toque em qualquer lugar • Totem reinicia automaticamente em 30s • {establishment.slug}</footer>
    </div>
  )
}
