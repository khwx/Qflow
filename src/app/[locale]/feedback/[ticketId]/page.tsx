'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket } from '@/types'
import toast from 'react-hot-toast'
import { Star, Send } from 'lucide-react'

const TAGS=['Atendimento rápido','Muito atencioso','Organizado','Limpeza','Voltarei','Precisa melhorar']

export default function FeedbackPage({params}:{params: Promise<{locale:string; ticketId:string}>}){
  const {ticketId}=use(params)
  const [ticket,setTicket]=useState<Ticket|null>(null)
  const [rating,setRating]=useState(0)
  const [hover,setHover]=useState(0)
  const [selectedTags,setSelectedTags]=useState<string[]>([])
  const [comment,setComment]=useState('')
  const [done,setDone]=useState(false)
  const [loading,setLoading]=useState(true)
  const supabase=createClientComponentClient()

  const load=useCallback(async()=>{
    const {data}=await supabase.from('tickets').select('*').eq('id',ticketId).single()
    if(data) setTicket(data as Ticket)
    const {data:fb}=await supabase.from('feedback').select('id').eq('ticket_id',ticketId).maybeSingle()
    if(fb) setDone(true)
    setLoading(false)
  },[ticketId,supabase])
  useEffect(()=>{load()},[load])

  const submit=async()=>{
    if(rating<1||rating>5){toast.error('Escolha 1-5 estrelas');return}
    if(!ticket) return
    const {error}=await supabase.from('feedback').insert({
      ticket_id: ticket.id,
      establishment_id: ticket.establishment_id,
      rating,
      tags: selectedTags,
      comment: comment.trim()||null
    })
    if(error){toast.error(error.message);return}
    toast.success('Obrigado pelo feedback!')
    setDone(true)
  }

  if(loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"/></div>
  if(!ticket) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">Senha não encontrada</div>
  if(done) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800 p-6"><div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 text-center max-w-md border border-gray-200 dark:border-gray-700 animate-scale-in"><div className="text-5xl mb-4">🙏</div><h1 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch">Obrigado!</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Seu feedback foi registrado.</p><p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Senha {ticket.ticket_number}</p></div></div>

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch text-center">Como foi seu atendimento?</h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">Senha {ticket.ticket_number} • toque nas estrelas</p>
      <div className="flex justify-center gap-1 sm:gap-2 my-6">
        {[1,2,3,4,5].map(n=>(
          <button key={n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(n)} aria-label={`${n} estrelas`} className="p-1 transition hover:scale-110">
            <Star className={`h-10 w-10 sm:h-12 sm:w-12 ${ (hover||rating)>=n ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600' }`} />
          </button>
        ))}
      </div>
      {rating>0 && <p className="text-center text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">{rating===5?'Excelente!':rating===4?'Muito bom':rating===3?'Ok':rating===2?'Ruim':'Péssimo'}</p>}
      <div className="flex flex-wrap gap-2 mb-4">
        {TAGS.map(tag=>{
          const active=selectedTags.includes(tag)
          return <button key={tag} onClick={()=> setSelectedTags(prev=> prev.includes(tag)? prev.filter(t=>t!==tag): [...prev,tag])} className={`px-3 py-1.5 rounded-full text-sm border transition ${active?'bg-indigo-600 text-white border-indigo-600':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{tag}</button>
        })}
      </div>
      <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comentário opcional..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"/>
      <button onClick={submit} disabled={rating===0} className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 transition"><Send className="h-5 w-5"/>Enviar feedback</button>
    </div>
  </div>
}
