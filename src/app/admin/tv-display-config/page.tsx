'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Monitor, Palette, Type, Volume2, Image as ImageIcon, LayoutGrid, Save, ExternalLink, Eye, Settings2, MessageSquare } from 'lucide-react'

type LayoutMode = 'grid' | 'single' | 'split'
type TvConfig = {
  layout: LayoutMode
  primary: string
  secondary: string
  logoUrl: string
  voiceEnabled: boolean
  message: string
  showWaiting: boolean
  tickerSpeed: number
}

const DEFAULT_CONFIG: TvConfig = {
  layout: 'grid',
  primary: '#4f46e5',
  secondary: '#7c3aed',
  logoUrl: '',
  voiceEnabled: true,
  message: 'Bem-vindo! Aguarde sua senha ser chamada no painel.',
  showWaiting: true,
  tickerSpeed: 12,
}

function TvConfigInner() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [config, setConfig] = useState<TvConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(!!estSlug)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()

  const storageKey = estSlug ? `tv-config:${estSlug}` : null

  const load = useCallback(async () => {
    if (!estSlug) { setLoading(false); return }
    const { data } = await supabase.from('establishments').select('*').eq('slug', estSlug).single()
    if (data) {
      setEstablishment(data as Establishment)
      // hydrate from DB colours + localStorage overrides
      const base: TvConfig = {
        layout: DEFAULT_CONFIG.layout,
        primary: (data as Establishment).primary_color || DEFAULT_CONFIG.primary,
        secondary: (data as Establishment).secondary_color || DEFAULT_CONFIG.secondary,
        logoUrl: (data as Establishment).logo_url || '',
        voiceEnabled: DEFAULT_CONFIG.voiceEnabled,
        message: (data as Establishment).description || DEFAULT_CONFIG.message,
        showWaiting: DEFAULT_CONFIG.showWaiting,
        tickerSpeed: DEFAULT_CONFIG.tickerSpeed,
      }
      try {
        const raw = storageKey ? localStorage.getItem(storageKey) : null
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<TvConfig>
          setConfig({ ...base, ...parsed, primary: parsed.primary || base.primary, secondary: parsed.secondary || base.secondary })
        } else {
          setConfig(base)
        }
      } catch { setConfig(base) }
    }
    setLoading(false)
  }, [estSlug, supabase, storageKey])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify(config)) } catch {}
  }, [config, storageKey])

  const save = async () => {
    if (!establishment) return
    setSaving(true)
    // persist visual fields to DB where possible; rest stays in localStorage
    const { error } = await supabase.from('establishments').update({
      primary_color: config.primary,
      secondary_color: config.secondary,
      logo_url: config.logoUrl || null,
      description: config.message || null,
    }).eq('id', establishment.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Configurações salvas!')
      setEstablishment({ ...establishment, primary_color: config.primary, secondary_color: config.secondary, logo_url: config.logoUrl || null, description: config.message } as Establishment)
    }
  }

  const previewUrl = estSlug ? `/${'pt'}/tv-display?code=${encodeURIComponent(estSlug)}` : null

  if (!estSlug) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Monitor className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configurar TV Display</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Escolha um estabelecimento para personalizar o painel da TV.</p>
        <Link href="/admin/establishments" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">Selecionar estabelecimento</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-12 w-64" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    )
  }

  if (!establishment) return <div className="text-center py-12 text-gray-500">Estabelecimento não encontrado.</div>

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings2 className="h-6 w-6 text-indigo-600" /> TV Display — Configurador</h2>
          <p className="text-gray-600 dark:text-gray-400">Personalize o painel exibido na TV • <span className="font-mono text-xs">{establishment.slug}</span> • WYSIWYG com preview ao vivo</p>
        </div>
        <div className="flex gap-2">
          {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"><ExternalLink className="h-4 w-4" /> Abrir TV</a>}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"><Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Controls */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><LayoutGrid className="h-5 w-5 text-indigo-600" /> Layout</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['grid','single','split'] as LayoutMode[]).map(m=> (
                <button key={m} onClick={()=>setConfig(c=>({...c, layout:m}))} className={`px-3 py-3 rounded-xl border text-sm font-medium capitalize transition ${config.layout===m ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{m==='grid'?'Grade':m==='single'?'Destaque':'Dividido'}</button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Grade: várias filas • Destaque: senha gigante • Dividido: chamada + fila</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Palette className="h-5 w-5 text-indigo-600" /> Cores & Marca</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Primária</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={config.primary} onChange={e=>setConfig(c=>({...c, primary:e.target.value}))} className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-700" aria-label="Cor primária" />
                  <input value={config.primary} onChange={e=>setConfig(c=>({...c, primary:e.target.value}))} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white" />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Secundária</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={config.secondary} onChange={e=>setConfig(c=>({...c, secondary:e.target.value}))} className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-700" aria-label="Cor secundária" />
                  <input value={config.secondary} onChange={e=>setConfig(c=>({...c, secondary:e.target.value}))} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white" />
                </div>
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Logo URL (opcional)</span>
              <input value={config.logoUrl} onChange={e=>setConfig(c=>({...c, logoUrl:e.target.value}))} placeholder="https://..." className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
            </label>
            {config.logoUrl ? <div className="h-14 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden p-2"><img src={config.logoUrl} alt="Logo preview" className="max-h-10 object-contain" onError={e=>((e.target as HTMLImageElement).style.display='none')} /></div> : null}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Volume2 className="h-5 w-5 text-indigo-600" /> Voz & Mensagem</h3>
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Voz ao chamar senha</span>
              <input type="checkbox" checked={config.voiceEnabled} onChange={e=>setConfig(c=>({...c, voiceEnabled:e.target.checked}))} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Mensagem do rodapé / boas-vindas</span>
              <textarea value={config.message} onChange={e=>setConfig(c=>({...c, message:e.target.value}))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" placeholder="Mensagem exibida na TV" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Mostrar “Próximas senhas”</span>
              <input type="checkbox" checked={config.showWaiting} onChange={e=>setConfig(c=>({...c, showWaiting:e.target.checked}))} className="h-5 w-5 rounded border-gray-300 text-indigo-600" />
            </label>
            <button onClick={()=>{
              try {
                if (!config.voiceEnabled) { toast('Voz desativada'); return }
                const u = new SpeechSynthesisUtterance(`Teste de voz. Senha A 12, guichê 1. ${config.message.slice(0,60)}`)
                u.lang='pt-BR'; u.rate=0.95; speechSynthesis.speak(u); toast.success('Reproduzindo voz')
              } catch { toast.error('Voz não suportada') }
            }} className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">Testar voz</button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium flex items-center gap-2"><Type className="h-4 w-4" /> Preview em tempo real</p>
            <p className="text-amber-700/80 dark:text-amber-200/80 mt-1">O painel à direita atualiza instantaneamente. Use o iframe abaixo para o preview fiel ao /tv-display.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {/* Mock WYSIWYG */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="h-5 w-5 text-indigo-600" /> Preview WYSIWYG</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">{config.layout}</span>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-900">
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-xl" style={{ background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})` }}>
                {/* Mock TV header */}
                <div className="p-4 sm:p-6 flex justify-between items-start text-white">
                  <div className="flex items-center gap-3">
                    {config.logoUrl ? <img src={config.logoUrl} alt="logo" className="h-10 w-10 rounded-xl bg-white/20 object-cover p-1" onError={e=>((e.target as HTMLImageElement).style.display='none')} /> : <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><Monitor className="h-6 w-6" /></div>}
                    <div>
                      <div className="font-bold text-lg leading-none">{establishment.name}</div>
                      <div className="text-white/70 text-xs mt-0.5">{config.message.slice(0,48)}{config.message.length>48?'…':''}</div>
                    </div>
                  </div>
                  <div className="bg-white/15 rounded-xl px-3 py-1.5 font-mono text-sm font-bold">12:34:56</div>
                </div>
                {/* Mock content by layout */}
                <div className="px-4 pb-4">
                  {config.layout==='single' ? (
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center border border-white/10">
                      <p className="text-white/70 text-sm mb-2">COMPAREÇA</p>
                      <p className="text-7xl font-black text-white tracking-tight">A12</p>
                      <p className="text-white/80 mt-2">Guichê 01 • Voz {config.voiceEnabled?'ativada':'desativada'}</p>
                    </div>
                  ) : config.layout==='split' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/40 rounded-2xl p-5 text-center">
                        <p className="text-green-200 text-xs font-semibold mb-1">COMPAREÇA</p>
                        <p className="text-5xl font-black text-white">B07</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                        <p className="text-white/60 text-xs mb-2">{config.showWaiting ? 'Próximas senhas' : 'Fila'}</p>
                        <div className="space-y-1.5">
                          <div className="bg-white/15 rounded-lg px-3 py-2 flex justify-between text-white font-mono font-bold"><span>B08</span><span className="text-green-300 text-xs bg-green-400/20 px-2 py-0.5 rounded-full">Agora</span></div>
                          <div className="bg-white/5 rounded-lg px-3 py-1.5 text-white/60 text-sm font-mono">B09 • +2</div>
                          <div className="bg-white/5 rounded-lg px-3 py-1.5 text-white/60 text-sm font-mono">B10 • +3</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2].map(i=>(
                        <div key={i} className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                          <div className="flex justify-between items-center mb-3"><span className="text-white font-semibold text-sm">Fila {i}</span><span className="text-white/50 text-xs">2 aguardando</span></div>
                          <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-3 text-center mb-3"><p className="text-green-300 text-[11px] font-semibold">COMPAREÇA</p><p className="text-3xl font-black text-green-300">A0{5+i}</p></div>
                          {config.showWaiting && <div className="bg-white/5 rounded-xl px-3 py-2 text-white/60 text-xs">Próximas: A0{6+i}, A0{7+i}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-3 text-center text-white/50 text-[11px] border-t border-white/10 pt-2">QFlow — {config.voiceEnabled ? 'Voz ativada' : 'Voz desativada'} • {config.message.slice(0,60)}</div>
              </div>
            </div>
          </div>

          {/* Live iframe */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Preview ao vivo (iframe /tv-display)</h4>
              <a href={previewUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Abrir em nova aba</a>
            </div>
            <div className="bg-gray-900 p-2">
              <div className="rounded-xl overflow-hidden border border-gray-700 bg-black aspect-[16/9] relative">
                {previewUrl ? (
                  <iframe src={previewUrl} title="TV Display preview" className="w-full h-full border-0" loading="lazy" sandbox="allow-scripts allow-same-origin" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Selecione um estabelecimento</div>
                )}
                <div className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white/70 backdrop-blur border border-white/10">iframe • realtime</div>
              </div>
            </div>
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">Dica: deixe a TV em <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/{establishment.slug}</code> ou use o QR da página TV Display.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TvDisplayConfigPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full" /></div>}>
      <TvConfigInner />
    </Suspense>
  )
}
