'use client'
import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket, Establishment } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Monitor, GripVertical, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLS: {key: Ticket['priority'], label:string, color:string, bg:string}[]=[
  {key:'normal',label:'Normal',color:'text-slate-600 dark:text-slate-300', bg:'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'},
  {key:'urgent',label:'Urgente',color:'text-red-600 dark:text-red-400', bg:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'},
  {key:'elderly',label:'Idoso',color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'},
  {key:'pregnant',label:'Gestante',color:'text-pink-600 dark:text-pink-400', bg:'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'},
]

function TriageInner(){
  const searchParams=useSearchParams()
  const estSlug=searchParams.get('est')
  const [establishment,setEstablishment]=useState<Establishment|null>(null)
  const [tickets,setTickets]=useState<Ticket[]>([])
  const [filter,setFilter]=useState<string>('all')
  const [loading,setLoading]=useState(!!estSlug)
  const [dragId,setDragId]=useState<string|null>(null)
  const supabase=createClientComponentClient()
  const chRef=useRef<ReturnType<typeof supabase.channel>|null>(null)

  const load=useCallback(async(estId:string)=>{
    const {data:qs}=await supabase.from('queues').select('id').eq('establishment_id',estId)
    if(!qs||qs.length===0){setTickets([]);setLoading(false);return}
    const ids=qs.map(q=>q.id)
    const {data}=await supabase.from('tickets').select('*').in('queue_id',ids).eq('status','waiting').order('created_at',{ascending:true})
    if(data) setTickets(data as Ticket[])
    setLoading(false)
  },[supabase])

  useEffect(()=>{
    if(!estSlug){setLoading(false);return}
    supabase.from('establishments').select('*').eq('slug',estSlug).single().then(({data})=>{
      setEstablishment(data)
      if(data) load(data.id); else setLoading(false)
    })
  },[estSlug,supabase,load])

  useEffect(()=>{
    if(!establishment) return
    if(chRef.current) supabase.removeChannel(chRef.current)
    const ch=supabase.channel(`triage-${establishment.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'tickets'},()=>load(establishment.id))
      .subscribe()
    chRef.current=ch
    return()=>{ if(chRef.current) supabase.removeChannel(chRef.current)}
  },[establishment,supabase,load])

  const patchPriority=async(id:string, priority: Ticket['priority'])=>{
    const {error}=await supabase.from('tickets').update({priority}).eq('id',id)
    if(error) toast.error(error.message); else {toast.success(`Prioridade → ${priority}`); if(establishment) load(establishment.id)}
  }

  const onDragStart=(id:string)=>setDragId(id)
  const onDrop=(targetPriority: Ticket['priority'])=>{
    if(!dragId) return
    patchPriority(dragId,targetPriority)
    setDragId(null)
  }

  if(!estSlug) return <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 mb-4">Selecione um estabelecimento</p><Link href="/admin/establishments" className="text-indigo-600 underline">Selecionar</Link></div>
  if(loading) return <div className="grid grid-cols-4 gap-4"><Skeleton className="h-64"/><Skeleton className="h-64"/><Skeleton className="h-64"/><Skeleton className="h-64"/></div>
  if(!establishment) return <div className="text-center py-12 text-gray-500">Não encontrado</div>

  const filtered= filter==='all'? tickets: tickets.filter(t=>t.priority===filter)

  return <div className="animate-fade-in -m-4 sm:-m-8">
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
      <span className="font-semibold text-gray-900 dark:text-white">{establishment.name}</span>
      <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"><Monitor className="h-3 w-3"/> destaque TV com ícone</span>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
        <option value="all">Todas prioridades</option><option value="normal">Normal</option><option value="urgent">Urgente</option><option value="elderly">Idoso</option><option value="pregnant">Gestante</option>
      </select>
      <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} aguardando</span>
    </div>
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4"><h2 className="text-xl font-bold text-gray-900 dark:text-white font-stitch">Triagem Kanban</h2><span className="text-xs text-gray-500 dark:text-gray-400">arraste para reordenar / mudar prioridade</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map(col=>{
          const colTickets=filtered.filter(t=>t.priority===col.key)
          return <div key={col.key} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(col.key)} className={cn('rounded-2xl border-2 border-dashed p-3 min-h-[380px] transition', col.bg, dragId && 'ring-2 ring-indigo-400')}>
            <div className={cn('flex items-center justify-between mb-3 font-semibold',col.color)}><span>{col.label}</span><span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 border">{colTickets.length}</span></div>
            <div className="space-y-2">
              {colTickets.map(t=>(
                <div key={t.id} draggable onDragStart={()=>onDragStart(t.id)} onDragEnd={()=>setDragId(null)} className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm cursor-grab active:cursor-grabbing flex flex-col gap-2 hover:shadow-md transition', dragId===t.id && 'opacity-50 ring-2 ring-indigo-400')}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400 shrink-0"/>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{t.ticket_number}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"><Clock3 className="h-3 w-3"/>{Math.round((Date.now()-new Date(t.created_at).getTime())/60000)}m</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{t.customer_name||'—'}</div>
                  <div className="flex gap-1 flex-wrap">
                    {COLS.filter(c=>c.key!==col.key).map(c=>(
                      <button key={c.key} onClick={()=>patchPriority(t.id,c.key)} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300 transition">{c.label} →</button>
                    ))}
                  </div>
                  {col.key!=='normal' && <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"><Monitor className="h-3 w-3"/> destaque TV</div>}
                </div>
              ))}
              {colTickets.length===0 && <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500 border border-dashed rounded-xl">Vazio — solte aqui</div>}
            </div>
          </div>
        })}
      </div>
    </div>
  </div>
}
export default function TriagePage(){ return <Suspense fallback={<Skeleton className="h-96"/>}><TriageInner/></Suspense>}
