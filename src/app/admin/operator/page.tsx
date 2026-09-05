'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Queue, Ticket, Establishment } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import {
  Megaphone,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock3,
  Users,
  Monitor,
  AlertTriangle,
  Volume2,
  Keyboard,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TicketWithWait = Ticket & { waitMinutes: number }

function priorityWeight(p: Ticket['priority']) {
  if (p === 'urgent') return 0
  if (p === 'elderly') return 1
  if (p === 'pregnant') return 1
  return 2
}

function OperatorInner() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [selectedQueueId, setSelectedQueueId] = useState<string>('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [guiche, setGuiche] = useState<string>('01')
  const [loading, setLoading] = useState(!!estSlug)
  const [calling, setCalling] = useState(false)
  const supabase = createClientComponentClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadEstablishment = useCallback(async () => {
    if (!estSlug) {
      setLoading(false)
      return
    }
    const { data } = await supabase.from('establishments').select('*').eq('slug', estSlug).single()
    if (data) {
      setEstablishment(data)
    } else {
      setLoading(false)
    }
  }, [estSlug, supabase])

  const loadQueues = useCallback(async (estId: string) => {
    const { data } = await supabase.from('queues').select('*').eq('establishment_id', estId).eq('is_active', true).order('name')
    if (data) {
      setQueues(data as Queue[])
      if (data.length > 0 && !selectedQueueId) setSelectedQueueId(data[0].id)
    }
  }, [supabase, selectedQueueId])

  const loadTickets = useCallback(async (estId: string) => {
    const { data: qs } = await supabase.from('queues').select('id').eq('establishment_id', estId).eq('is_active', true)
    if (!qs || qs.length === 0) {
      setTickets([])
      setLoading(false)
      return
    }
    const ids = qs.map(q => q.id)
    const { data } = await supabase.from('tickets').select('*').in('queue_id', ids).in('status', ['waiting', 'called', 'serving']).order('created_at', { ascending: true })
    if (data) setTickets(data as Ticket[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadEstablishment()
  }, [loadEstablishment])

  useEffect(() => {
    if (!establishment) return
    loadQueues(establishment.id)
    loadTickets(establishment.id)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`operator-${establishment.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => loadTickets(establishment.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => loadQueues(establishment.id))
      .subscribe()
    channelRef.current = ch
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [establishment, loadQueues, loadTickets, supabase])

  // Keyboard shortcuts F1 chamar, F2 concluir, F3 rechamar
  const waiting = tickets.filter(t => (selectedQueueId ? t.queue_id === selectedQueueId : true) && t.status === 'waiting')
    .sort((a,b) => priorityWeight(a.priority)-priorityWeight(b.priority) || new Date(a.created_at).getTime()-new Date(b.created_at).getTime())
  const called = tickets.filter(t => (selectedQueueId ? t.queue_id === selectedQueueId : true) && t.status === 'called')
  const serving = tickets.filter(t => (selectedQueueId ? t.queue_id === selectedQueueId : true) && t.status === 'serving')
  const current = called[0] ?? serving[0] ?? null

  const callNext = useCallback(async () => {
    if (calling) return
    const next = waiting[0]
    if (!next) {
      toast.error('Nenhuma senha aguardando nesta fila')
      return
    }
    setCalling(true)
    const { error } = await supabase.from('tickets').update({ status: 'called', called_at: new Date().toISOString(), notes: guiche ? `Guichê ${guiche}` : next.notes }).eq('id', next.id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Chamando ${next.ticket_number} — Guichê ${guiche}`)
      try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(`Senha ${next.ticket_number}, guichê ${guiche}`); u.lang='pt-BR'; u.rate=0.95; speechSynthesis.speak(u) } } catch {}
      // chime
      try {
        const AC = (window as unknown as { AudioContext: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AC) { const ctx = new AC(); [523,659,784].forEach((f,i)=>{ const o=ctx.createOscillator(); const g=ctx.createGain(); o.frequency.value=f; g.connect(ctx.destination); g.gain.setValueAtTime(0.22, ctx.currentTime+i*0.11); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+i*0.11+0.45); o.start(ctx.currentTime+i*0.11); o.stop(ctx.currentTime+i*0.11+0.45) }) }
      } catch {}
    }
    setCalling(false)
    if (establishment) loadTickets(establishment.id)
  }, [waiting, supabase, guiche, establishment, loadTickets, calling])

  const completeCurrent = useCallback(async () => {
    if (!current) { toast.error('Nenhuma senha em atendimento'); return }
    const { error } = await supabase.from('tickets').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', current.id)
    if (error) toast.error(error.message)
    else toast.success(`${current.ticket_number} concluída`)
    if (establishment) loadTickets(establishment.id)
  }, [current, supabase, establishment, loadTickets])

  const recallCurrent = useCallback(async () => {
    if (!current) { toast.error('Nenhuma senha para rechamar'); return }
    const { error } = await supabase.from('tickets').update({ called_at: new Date().toISOString() }).eq('id', current.id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Rechamando ${current.ticket_number}`)
      try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(`Rechamando senha ${current.ticket_number}, guichê ${guiche}`); u.lang='pt-BR'; speechSynthesis.speak(u) } } catch {}
    }
    if (establishment) loadTickets(establishment.id)
  }, [current, supabase, guiche, establishment, loadTickets])

  const cancelTicket = async (id: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'cancelled' }).eq('id', id)
    if (error) toast.error(error.message)
    else toast.success('Senha cancelada')
    if (establishment) loadTickets(establishment.id)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); callNext() }
      if (e.key === 'F2') { e.preventDefault(); completeCurrent() }
      if (e.key === 'F3') { e.preventDefault(); recallCurrent() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [callNext, completeCurrent, recallCurrent])

  if (!estSlug) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Monitor className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Painel do Operador</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Selecione um estabelecimento para operar o guichê.</p>
        <Link href="/admin/establishments" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">Selecionar estabelecimento</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-14 w-full" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!establishment) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Estabelecimento não encontrado para “{estSlug}”.</div>
  }

  const waitingWithMinutes: TicketWithWait[] = waiting.map(t => ({ ...t, waitMinutes: Math.max(0, Math.round((Date.now() - new Date(t.created_at).getTime())/60000)) }))

  return (
    <div className="animate-fade-in -m-4 sm:-m-8">
      {/* Sticky operator bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{establishment.name}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{establishment.slug}</span>
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        <select value={selectedQueueId} onChange={e=>setSelectedQueueId(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
          {queues.map(q=> <option key={q.id} value={q.id}>{q.name}</option>)}
          {queues.length===0 && <option value="">Sem filas</option>}
        </select>
        <label className="flex items-center gap-2 text-sm ml-1">
          <span className="text-gray-600 dark:text-gray-300">Guichê</span>
          <input value={guiche} onChange={e=>setGuiche(e.target.value.replace(/[^0-9]/g,'').slice(0,2) || '1')} className="w-14 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center font-mono font-bold text-gray-900 dark:text-white" aria-label="Número do guichê" />
        </label>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[11px]">F1</kbd> Chamar <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[11px]">F2</kbd> Concluir <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[11px]">F3</kbd> Rechamar</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Action bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button onClick={callNext} disabled={waiting.length===0 || calling} className="group flex items-center justify-center gap-3 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/20 transition hover:scale-[1.01] active:scale-[0.99]">
            <Megaphone className="h-7 w-7" />
            <div className="text-left">
              <div className="font-bold text-lg leading-none">Chamar próximo</div>
              <div className="text-white/80 text-xs">F1 • {waiting.length} na fila</div>
            </div>
          </button>
          <button onClick={completeCurrent} disabled={!current} className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl p-5 shadow-lg transition hover:scale-[1.01]">
            <CheckCircle2 className="h-7 w-7" />
            <div className="text-left">
              <div className="font-bold text-lg leading-none">Concluir</div>
              <div className="text-white/80 text-xs">F2 • Finaliza atendimento</div>
            </div>
          </button>
          <button onClick={recallCurrent} disabled={!current} className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-900 dark:text-white rounded-2xl p-5 shadow-sm transition hover:scale-[1.01]">
            <RotateCcw className="h-6 w-6 text-amber-600" />
            <div className="text-left">
              <div className="font-bold text-base leading-none">Rechamar</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">F3 • Som + voz</div>
            </div>
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Left: serving / called highlight */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Volume2 className="h-5 w-5 text-indigo-600" /> Em atendimento</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Guichê {guiche}</span>
              </div>
              {current ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {current.status === 'called' ? 'Chamando' : 'Em atendimento'}
                  </div>
                  <div className="text-6xl sm:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-2">{current.ticket_number}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{current.customer_name || 'Cliente'}</div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock3 className="h-4 w-4" /> {new Date(current.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit'})} • {current.priority !== 'normal' && <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 capitalize">{current.priority}</span>}
                  </div>
                  <div className="flex gap-2 justify-center mt-5">
                    <button onClick={completeCurrent} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition">Concluir (F2)</button>
                    <button onClick={recallCurrent} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition">Rechamar</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <Timer className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhuma senha em atendimento</p>
                  <p className="text-sm">Pressione F1 para chamar o próximo</p>
                </div>
              )}
              {(called.length>1 || serving.length> (current?.status==='serving'?1:0)) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Outros chamados</p>
                  <div className="flex flex-wrap gap-2">
                    {[...called.slice(current?.status==='called'?1:0), ...serving.filter(s=>s.id!==current?.id)].slice(0,6).map(t=> (
                      <span key={t.id} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-mono font-bold text-gray-700 dark:text-gray-200">{t.ticket_number}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-indigo-900 dark:text-indigo-200">Dicas de operação</p>
                <ul className="text-indigo-700/80 dark:text-indigo-300/80 list-disc ml-4 mt-1 space-y-0.5">
                  <li>Prioridades (urgente/idoso/gestante) sobem automaticamente.</li>
                  <li>Use F1/F2 sem tirar as mãos do teclado.</li>
                  <li>O display da TV atualiza em tempo real via Supabase.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: waiting list */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Users className="h-5 w-5 text-gray-500" /> Fila — Aguardando <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold">{waiting.length}</span></h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Ordenado por prioridade e horário</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[560px] overflow-auto">
                {waitingWithMinutes.length===0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">Fila vazia</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma senha aguardando nesta fila</p>
                  </div>
                ) : waitingWithMinutes.map((t,i)=> (
                  <div key={t.id} className={cn('flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition', i===0 && 'bg-indigo-50/60 dark:bg-indigo-900/10')}>
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0', i===0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>{i+1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-gray-900 dark:text-white">{t.ticket_number}</span>
                        {t.priority!=='normal' && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 uppercase">{t.priority}</span>}
                        {i===0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">PRÓXIMO</span>}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{t.customer_name || '—'} {t.customer_phone ? `• ${t.customer_phone}` : ''}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1 justify-end"><Clock3 className="h-4 w-4 text-gray-400" /> {t.waitMinutes} min</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {i===0 && <button onClick={callNext} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition" title="Chamar (F1)"><Megaphone className="h-4 w-4" /></button>}
                      <button onClick={()=>cancelTicket(t.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition" title="Cancelar"><XCircle className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OperatorPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full" /></div>}>
      <OperatorInner />
    </Suspense>
  )
}
