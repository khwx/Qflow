'use client'

import { Establishment, TvConfig } from '@/types'
import Image from 'next/image'
import { Eye, ExternalLink, Monitor } from 'lucide-react'

interface TvConfigPreviewProps {
  config: TvConfig
  establishment: Establishment
  previewUrl: string | null
}

const LAYOUT_LABELS: Record<string, string> = {
  grid: 'Grade',
  single: 'Destaque',
  split: 'Dividido',
}

export default function TvConfigPreview({
  config,
  establishment,
  previewUrl,
}: TvConfigPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Mock WYSIWYG */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" /> Preview WYSIWYG
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
            {LAYOUT_LABELS[config.layout] || config.layout}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-900">
          <div className="rounded-2xl overflow-hidden border border-white/20 shadow-xl" style={{ background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})` }}>
            {/* Mock TV header */}
            <div className="p-4 sm:p-6 flex justify-between items-start text-white">
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <Image src={config.logoUrl} alt="logo" width={40} height={40} className="rounded-xl bg-white/20 object-cover p-1" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Monitor className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-lg leading-none">{establishment.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{config.message.slice(0, 48)}{config.message.length > 48 ? '…' : ''}</div>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-1.5 font-mono text-sm font-bold">12:34:56</div>
            </div>
            {/* Mock content by layout */}
            <div className="px-4 pb-4">
              {config.layout === 'single' ? (
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center border border-white/10">
                  <p className="text-white/70 text-sm mb-2">COMPAREÇA</p>
                  <p className="text-7xl font-black text-white tracking-tight">A12</p>
                  <p className="text-white/80 mt-2">Guichê 01 • Voz {config.voiceEnabled ? 'ativada' : 'desativada'}</p>
                </div>
              ) : config.layout === 'split' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/40 rounded-2xl p-5 text-center">
                    <p className="text-green-200 text-xs font-semibold mb-1">COMPAREÇA</p>
                    <p className="text-5xl font-black text-white">B07</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-white/60 text-xs mb-2">{config.showWaiting ? 'Próximas senhas' : 'Fila'}</p>
                    <div className="space-y-1.5">
                      <div className="bg-white/15 rounded-lg px-3 py-2 flex justify-between text-white font-mono font-bold">
                        <span>B08</span>
                        <span className="text-green-300 text-xs bg-green-400/20 px-2 py-0.5 rounded-full">Agora</span>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-1.5 text-white/60 text-sm font-mono">B09 • +2</div>
                      <div className="bg-white/5 rounded-lg px-3 py-1.5 text-white/60 text-sm font-mono">B10 • +3</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-semibold text-sm">Fila {i}</span>
                        <span className="text-white/50 text-xs">2 aguardando</span>
                      </div>
                      <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-3 text-center mb-3">
                        <p className="text-green-300 text-[11px] font-semibold">COMPAREÇA</p>
                        <p className="text-3xl font-black text-green-300">A0{5 + i}</p>
                      </div>
                      {config.showWaiting && <div className="bg-white/5 rounded-xl px-3 py-2 text-white/60 text-xs">Próximas: A0{6 + i}, A0{7 + i}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 pb-3 text-center text-white/50 text-[11px] border-t border-white/10 pt-2">
              QFlow — {config.voiceEnabled ? 'Voz ativada' : 'Voz desativada'} • {config.message.slice(0, 60)}
            </div>
          </div>
        </div>
      </div>

      {/* Live iframe */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">Preview ao vivo (iframe /tv-display)</h4>
          <a href={previewUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> Abrir em nova aba
          </a>
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
        <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          Dica: deixe a TV em <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/{establishment.slug}</code> ou use o QR da página TV Display.
        </div>
      </div>
    </div>
  )
}