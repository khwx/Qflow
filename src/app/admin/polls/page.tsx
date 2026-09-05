'use client'
import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Poll, Establishment } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { generateCsv, downloadCsv, type CsvColumn } from '@/lib/exportCsv'
import toast from 'react-hot-toast'
import { Plus, Trash2, ToggleLeft, ToggleRight, Download, BarChart3, Clock, X } from 'lucide-react'

interface PollWithResults extends Poll { responses: { option_index:number }[] }

function PollsInner(){
  const searchParams=useSearchParams()
  const estSlug=searchParams.get('est')
  const [establishment,setEstablishment]=useState<Establishment|null>(null)
  const [polls,setPolls]=useState<PollWithResults[]>([])
  const [loading,setLoading]=useState(!!estSlug)
  const [showForm,setShowForm]=useState(false)
  const [question,setQuestion]=useState('')
  const [options,setOptions]=useState<string[]>(['',''])
  const [expiresAt,setExpiresAt]=useState('')
  const supabase=createClientComponentClient()
  const chRef=useRef<ReturnType<typeof supabase.channel>|null>(null)

  const load=useCallback(async(estId:string)=>{
    const {data}=await supabase.from('polls').select('*').eq('establishment_id',estId).order('created_at',{ascending:false})
    if(!data){setLoading(false);return}
    const enriched:PollWithResults[]=[]
    for(const p of data as Poll[]){
      const {data:resp}=await supabase.from('poll_responses').select('option_index').eq('poll_id',p.id)
      enriched.push({...p, responses: resp||[]})
    }
    setPolls(enriched)
    setLoading(false)
  },[supabase])

  useEffect(()=>{
    if(!estSlug){setLoading(false);return}
    supabase.from('establishments').select('*').eq('slug',estSlug).single().then(({data})=>{
      setEstablishment(data)
      if(data) load(data.id)
      else setLoading(false)
    })
  },[estSlug,supabase,load])

  useEffect(()=>{
    if(!establishment) return
    if(chRef.current) supabase.removeChannel(chRef.current)
    const ch=supabase.channel(`polls-${establishment.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'polls'},()=>load(establishment.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'poll_responses'},()=>load(establishment.id))
      .subscribe()
    chRef.current=ch
    return()=>{ if(chRef.current) supabase.removeChannel(chRef.current)}
  },[establishment,supabase,load])

  const createPoll=async(e:React.FormEvent)=>{
    e.preventDefault()
    const cleanOpts=options.map(o=>o.trim()).filter(Boolean)
    if(!question.trim()||cleanOpts.length<2){ toast.error('Pergunta + mínimo 2 opções');return}
    const {error}=await supabase.from('polls').insert({
      establishment_id: establishment!.id,
      question: question.trim(),
      options: cleanOpts,
      is_active:true,
      expires_at: expiresAt? new Date(expiresAt).toISOString(): null
    })
    if(error){toast.error(error.message);return}
    toast.success('Enquete criada')
    setQuestion('');setOptions(['','']);setExpiresAt('');setShowForm(false)
    load(establishment!.id)
  }
  const toggle=async(p:Poll)=>{
    const {error}=await supabase.from('polls').update({is_active:!p.is_active}).eq('id',p.id)
    if(error) toast.error(error.message); else {toast.success(p.is_active?'Desativada':'Ativada'); load(establishment!.id)}
  }
  const delPoll=async(id:string)=>{
    if(!confirm('Excluir enquete?')) return
    const {error}=await supabase.from('polls').delete().eq('id',id)
    if(error) toast.error(error.message); else {toast.success('Excluída'); load(establishment!.id)}
  }
  const exportCsv=()=>{
    if(polls.length===0){toast.error('Nada para exportar');return}
    const cols: CsvColumn<PollWithResults>[]=[
      {header:'Pergunta',accessor:p=>p.question},
      {header:'Opções',accessor:p=>p.options.join(' | ')},
      {header:'Ativa',accessor:p=>p.is_active?'Sim':'Não'},
      {header:'Expira',accessor:p=>p.expires_at? new Date(p.expires_at).toLocaleString('pt-BR'):''},
      {header:'Respostas',accessor:p=>String(p.responses.length)},
      ...Array.from({length: Math.max(...polls.map(p=>p.options.length),0)}).map((_,i)=>({header:`Votos op ${i+1}`,accessor:(p:PollWithResults)=>String(p.responses.filter(r=>r.option_index===i).length)} as CsvColumn<PollWithResults>))
    ]
    const csv=generateCsv(polls,cols)
    downloadCsv(csv,`enquetes-${establishment?.slug}-${new Date().toISOString().slice(0,10)}.csv`)
    toast.success('CSV exportado')
  }

  if(!estSlug) return <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 mb-4">Selecione um estabelecimento</p><Link href="/admin/establishments" className="text-indigo-600 underline">Selecionar</Link></div>
  if(loading) return <div className="space-y-4"><Skeleton className="h-20"/><Skeleton className="h-64"/></div>
  if(!establishment) return <div className="text-center py-12 text-gray-500">Estabelecimento não encontrado</div>

  return <div className="animate-fade-in">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch">Enquetes</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Gestão de enquetes de {establishment.name} • realtime barras %</p></div>
      <div className="flex gap-2">
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition"><Download className="h-4 w-4"/>Exportar CSV</button>
        <button onClick={()=>setShowForm(!showForm)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow hover:scale-[1.02] transition"><Plus className="h-4 w-4"/>Nova enquete</button>
      </div>
    </div>
    {showForm && <form onSubmit={createPoll} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-scale-in space-y-4">
      <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pergunta</label><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ex: Como avalia nosso atendimento?" className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/></div>
      <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opções</label>
        <div className="space-y-2 mt-1">
          {options.map((opt,i)=><div key={i} className="flex gap-2"><input value={opt} onChange={e=>{const c=[...options];c[i]=e.target.value;setOptions(c)}} placeholder={`Opção ${i+1}`} className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/><button type="button" onClick={()=>setOptions(options.filter((_,j)=>j!==i))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" disabled={options.length<=2}><X className="h-4 w-4"/></button></div>)}
        </div>
        <button type="button" onClick={()=>setOptions([...options,''])} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Adicionar opção</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Clock className="h-4 w-4"/>Expira em (opcional)</label><input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div>
      </div>
      <div className="flex gap-2"><button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">Criar enquete</button><button type="button" onClick={()=>setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Cancelar</button></div>
    </form>}
    <div className="space-y-4">
      {polls.length===0 && <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"><BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40"/>Nenhuma enquete ainda</div>}
      {polls.map(p=>{
        const total=p.responses.length
        return <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1"><h3 className="font-semibold text-gray-900 dark:text-white">{p.question}</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{total} votos • {p.is_active?'Ativa':'Inativa'} {p.expires_at && `• expira ${new Date(p.expires_at).toLocaleString('pt-BR')}`}</p></div>
            <div className="flex items-center gap-1">
              <button onClick={()=>toggle(p)} className={p.is_active?'text-green-600':'text-gray-400'} title={p.is_active?'Desativar':'Ativar'}>{p.is_active?<ToggleRight className="h-6 w-6"/>:<ToggleLeft className="h-6 w-6"/>}</button>
              <button onClick={()=>delPoll(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="h-4 w-4"/></button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {p.options.map((opt,i)=>{
              const cnt=p.responses.filter(r=>r.option_index===i).length
              const pct= total? Math.round(cnt/total*100):0
              return <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-1/3 truncate">{opt}</span>
                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all" style={{width:`${pct}%`}}/></div>
                <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 w-20 text-right">{cnt} ({pct}%)</span>
              </div>
            })}
          </div>
        </div>
      })}
    </div>
  </div>
}
export default function PollsPage(){ return <Suspense fallback={<Skeleton className="h-96"/>}><PollsInner/></Suspense>}
