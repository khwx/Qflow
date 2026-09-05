'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Customer, Ticket } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { ArrowLeft, Star, Trophy, Clock, TrendingUp, Save, Award } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function CustomerDetailPage({params}:{params: Promise<{id:string}>}){
  const {id}=use(params)
  const searchParams=useSearchParams()
  const estSlug=searchParams.get('est')
  const [customer,setCustomer]=useState<Customer|null>(null)
  const [tickets,setTickets]=useState<Ticket[]>([])
  const [loading,setLoading]=useState(true)
  const [points,setPoints]=useState(0)
  const [saving,setSaving]=useState(false)
  const supabase=createClientComponentClient()

  const load=useCallback(async()=>{
    const {data: c}=await supabase.from('customers').select('*').eq('id',id).single()
    if(c){ setCustomer(c as Customer); setPoints((c as Customer).total_points)}
    if(c){
      const {data: t}=await supabase.from('tickets').select('*').eq('customer_id',c.id).order('created_at',{ascending:false}).limit(50)
      if(t) setTickets(t as Ticket[])
    }
    setLoading(false)
  },[id,supabase])

  useEffect(()=>{load()},[load])

  const savePoints=async()=>{
    if(!customer) return
    setSaving(true)
    const {error}=await supabase.from('customers').update({total_points: points, updated_at: new Date().toISOString()}).eq('id',customer.id)
    setSaving(false)
    if(error) toast.error(error.message); else {toast.success('Pontos atualizados'); setCustomer({...customer, total_points: points})}
  }

  if(loading) return <div className="p-6 space-y-4"><Skeleton className="h-32"/><Skeleton className="h-64"/></div>
  if(!customer) return <div className="text-center py-12 text-gray-500">Cliente não encontrado</div>

  const maxP=Math.max(...tickets.map((_,i)=> tickets.slice(0,i+1).length),1)

  return <div className="animate-fade-in space-y-6">
    <Link href={estSlug?`/admin/customers?est=${estSlug}`:'/admin/customers'} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><ArrowLeft className="h-4 w-4"/>Voltar</Link>

    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"/>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
        <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black shrink-0">{(customer.name||customer.email||'?').slice(0,1).toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-stitch">{customer.name||'Cliente'}</h1>
          <p className="text-white/80 text-sm truncate">{customer.email||''} {customer.phone?`• ${customer.phone}`:''}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-medium"><Trophy className="h-4 w-4"/>{customer.total_points} pontos</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-medium"><Award className="h-4 w-4"/>{customer.total_visits} visitas</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm"><Clock className="h-4 w-4"/>{new Date(customer.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white shadow-lg w-full sm:w-auto">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ajustar pontos</label>
          <div className="flex gap-2 mt-1">
            <input type="number" value={points} onChange={e=>setPoints(Number(e.target.value))} className="w-28 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono font-bold"/>
            <button onClick={savePoints} disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"><Save className="h-4 w-4"/>Salvar</button>
          </div>
          <div className="flex gap-1 mt-2">
            {[-50,-10,10,50].map(d=><button key={d} onClick={()=>setPoints(p=>Math.max(0,p+d))} className="flex-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">{d>0?`+${d}`:d}</button>)}
          </div>
        </div>
      </div>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-indigo-600"/>Evolução (visitas)</h3>
        {tickets.length===0? <p className="text-sm text-gray-500 dark:text-gray-400">Sem histórico ainda</p> :
        <div className="flex items-end gap-1 h-28">
          {[...tickets].reverse().slice(-20).map((t,i,arr)=>{
            const h= Math.round(((i+1)/arr.length)*100)
            return <div key={t.id} title={`${t.ticket_number} ${new Date(t.created_at).toLocaleDateString('pt-BR')}`} className="flex-1 bg-gradient-to-t from-indigo-600 to-violet-400 rounded-t-lg transition" style={{height:`${Math.max(8,h)}%`}}/>
          })}
        </div>}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{tickets.length} senhas no histórico</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-amber-500"/>Cartão Fidelidade</h3>
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white text-center">
          <div className="text-4xl font-black">{customer.total_points}</div><div className="text-white/80 text-sm">pontos acumulados</div>
          <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-white" style={{width:`${Math.min(100, (customer.total_points%500)/5)}%`}}/></div>
          <div className="text-xs text-white/70 mt-1">{500 - (customer.total_points%500)} pts para próxima recompensa</div>
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Timeline de senhas</div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {tickets.length===0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400">Nenhuma senha vinculada</div>}
        {tickets.map(t=>(
          <div key={t.id} className="px-6 py-3 flex items-center gap-4">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.ticket_number}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status==='completed'?'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': t.status==='waiting'?'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{t.status}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{new Date(t.created_at).toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
}
