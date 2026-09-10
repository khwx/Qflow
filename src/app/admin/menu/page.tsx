'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment, MenuItem } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Plus, Trash2, GripVertical, UtensilsCrossed, DollarSign, Tag } from 'lucide-react'

function MenuInner(){
  const searchParams=useSearchParams()
  const estSlug=searchParams.get('est')
  const [establishment,setEstablishment]=useState<Establishment|null>(null)
  const [items,setItems]=useState<MenuItem[]>([])
  const [loading,setLoading]=useState(!!estSlug)
  const [saving,setSaving]=useState(false)
  const [showForm,setShowForm]=useState(false)
  const [name,setName]=useState('')
  const [price,setPrice]=useState('')
  const [category,setCategory]=useState('')
  const supabase=createClientComponentClient()

  const load=useCallback(async(estId:string)=>{
    const {data}=await supabase.from('establishments').select('menu_items').eq('id',estId).single()
    if(data) setItems((data.menu_items as MenuItem[])||[])
    setLoading(false)
  },[supabase])

  useEffect(()=>{
    if(!estSlug){ return }
    supabase.from('establishments').select('*').eq('slug',estSlug).single().then(({data})=>{
      if(data){ setEstablishment(data); load(data.id) }
    })
  },[estSlug,supabase,load])

  const saveItems=async(newItems:MenuItem[])=>{
    if(!establishment) return
    setSaving(true)
    const {error}=await supabase.from('establishments').update({menu_items:newItems}).eq('id',establishment.id)
    setSaving(false)
    if(error){toast.error(error.message||'Erro ao salvar cardápio');return}
    setItems(newItems)
    toast.success('Cardápio salvo')
  }

  const addItem=async(e:React.FormEvent)=>{
    e.preventDefault()
    const priceNum=parseFloat(price)
    if(!name.trim()||isNaN(priceNum)||priceNum<0){toast.error('Nome e preço válidos obrigatórios');return}
    const newItem:MenuItem={
      id: crypto.randomUUID(),
      name: name.trim(),
      price: priceNum,
      category: category.trim()||null,
    }
    await saveItems([...items,newItem])
    setName('');setPrice('');setCategory('');setShowForm(false)
  }

  const removeItem=async(id:string)=>{
    if(!confirm('Remover item do cardápio?')) return
    await saveItems(items.filter(i=>i.id!==id))
  }

  const moveItem=async(index:number,direction:-1|1)=>{
    const target=index+direction
    if(target<0||target>=items.length) return
    const arr=[...items]
    ;[arr[index],arr[target]]=[arr[target]!,arr[index]!]
    await saveItems(arr)
  }

  if(!estSlug) return <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 mb-4">Selecione um estabelecimento</p><Link href="/admin/establishments" className="text-indigo-600 underline">Selecionar</Link></div>
  if(loading) return <div className="space-y-4"><Skeleton className="h-20"/><Skeleton className="h-64"/></div>
  if(!establishment) return <div className="text-center py-12 text-gray-500">Estabelecimento não encontrado</div>

  const categories=[...new Set(items.map(i=>i.category).filter(Boolean))] as string[]

  return <div className="animate-fade-in">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch">Cardápio</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{items.length} itens • {establishment.name}</p></div>
      <button onClick={()=>setShowForm(!showForm)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow hover:scale-[1.02] transition"><Plus className="h-4 w-4"/>{showForm?'Fechar':'Novo item'}</button>
    </div>

    {showForm && <form onSubmit={addItem} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-scale-in space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1"><label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><UtensilsCrossed className="h-4 w-4"/>Nome</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Café Expresso" className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/></div>
        <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><DollarSign className="h-4 w-4"/>Preço (R$)</label><input type="number" step="0.01" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/></div>
        <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Tag className="h-4 w-4"/>Categoria (opc.)</label><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Bebidas, Lanches..." className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div>
      </div>
      <div className="flex gap-2"><button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">{saving?'Salvando...':'Adicionar'}</button><button type="button" onClick={()=>setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Cancelar</button></div>
    </form>}

    {categories.length>0 && <div className="flex flex-wrap gap-2 mb-4 text-xs">
      {categories.map(c=><span key={c} className="px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium">{c}</span>)}
    </div>}

    <div className="space-y-3">
      {items.length===0 && <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"><UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-40"/>Nenhum item no cardápio</div>}
      {items.map((item,idx)=>(
        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 hover:shadow-sm transition">
          <div className="flex flex-col gap-0.5">
            <button onClick={()=>moveItem(idx,-1)} disabled={idx===0} className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition" aria-label="Mover para cima"><GripVertical className="h-3 w-3 rotate-180"/></button>
            <button onClick={()=>moveItem(idx,1)} disabled={idx===items.length-1} className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition" aria-label="Mover para baixo"><GripVertical className="h-3 w-3"/></button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {item.category && <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">{item.category}</span>}
            </div>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
            {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(item.price)}
          </span>
          <button onClick={()=>removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" aria-label={`Remover ${item.name}`}><Trash2 className="h-4 w-4"/></button>
        </div>
      ))}
    </div>
  </div>
}

export default function MenuPage(){ return <Suspense fallback={<Skeleton className="h-96"/>}><MenuInner/></Suspense>}
