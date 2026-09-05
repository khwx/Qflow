'use client'
import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { Star } from 'lucide-react'

interface FB { id:string; ticket_id:string; rating:number; tags:string[]; comment:string|null; created_at:string; tickets?:{ticket_number:string}|null }

function FeedbackAdminInner(){
  const searchParams=useSearchParams()
  const estSlug=searchParams.get('est')
  const [establishment,setEstablishment]=useState<Establishment|null>(null)
  const [items,setItems]=useState<FB[]>([])
  const [loading,setLoading]=useState(!!estSlug)
  const supabase=createClientComponentClient()
  const chRef=useRef<ReturnType<typeof supabase.channel>|null>(null)

  const load=useCallback(async(estId:string)=>{
    const {data}=await supabase.from('feedback').select('*, tickets(ticket_number)').eq('establishment_id',estId).order('created_at',{ascending:false}).limit(200)
    if(data) setItems(data as unknown as FB[])
    setLoading(false)
  },[supabase])

  useEffect(()=>{
    if(!estSlug){setLoading(false);return}
    supabase.from('establishments').select('*').eq('slug',estSlug).single().then(({data})=>{
      setEstablishment(data); if(data) load(data.id); else setLoading(false)
    })
  },[estSlug,supabase,load])

  useEffect(()=>{
    if(!establishment) return
    if(chRef.current) supabase.removeChannel(chRef.current)
    const ch=supabase.channel(`feedback-${establishment.id}`).on('postgres_changes',{event:'*',schema:'public',table:'feedback'},()=>load(establishment.id)).subscribe()
    chRef.current=ch
    return()=>{ if(chRef.current) supabase.removeChannel(chRef.current)}
  },[establishment,supabase,load])

  if(!estSlug) return <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 mb-4">Selecione um estabelecimento</p><Link href="/admin/establishments" className="text-indigo-600 underline">Selecionar</Link></div>
  if(loading) return <div className="space-y-3"><Skeleton className="h-20"/><Skeleton className="h-64"/></div>
  if(!establishment) return <div className="text-center py-12 text-gray-500">Não encontrado</div>

  const avg = items.length? (items.reduce((s,x)=>s+x.rating,0)/items.length).toFixed(1): '—'
  const dist=[1,2,3,4,5].map(n=>({n, cnt: items.filter(x=>x.rating===n).length}))

  return <div className="animate-fade-in">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch">Feedback</h2><p className="text-sm text-gray-500 dark:text-gray-400">Média e avaliações de {establishment.name}</p></div>
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3">
        <div className="text-center"><div className="text-3xl font-black text-amber-500 flex items-center gap-1 justify-center"><Star className="h-7 w-7 fill-amber-400 text-amber-400"/>{avg}</div><div className="text-xs text-gray-500 dark:text-gray-400">{items.length} avaliações</div></div>
        <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"/>
        <div className="space-y-1">
          {dist.map(d=>{
            const pct= items.length? Math.round(d.cnt/items.length*100):0
            return <div key={d.n} className="flex items-center gap-2 text-xs"><span className="w-6 text-gray-500">{d.n}★</span><div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{width:`${pct}%`}}/></div><span className="w-8 text-gray-600 dark:text-gray-300">{d.cnt}</span></div>
          })}
        </div>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.length===0 && <div className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhum feedback ainda — compartilhe /feedback/[ticketId]</div>}
        {items.map(f=>(
          <div key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1 shrink-0">{[1,2,3,4,5].map(n=> <Star key={n} className={`h-5 w-5 ${n<=f.rating?'fill-amber-400 text-amber-400':'text-gray-300 dark:text-gray-600'}`} />)}</div>
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{f.tickets?.ticket_number||f.ticket_id.slice(0,8)}</span>
            <div className="flex flex-wrap gap-1">{(f.tags||[]).map(t=> <span key={t} className="px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs">{t}</span>)}</div>
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{f.comment||'—'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{new Date(f.created_at).toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
}
export default function FeedbackAdminPage(){ return <Suspense fallback={<Skeleton className="h-96"/>}><FeedbackAdminInner/></Suspense>}
