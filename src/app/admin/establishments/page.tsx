'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { QrCode, Building2, BarChart3, Settings, Plus } from 'lucide-react'

interface EstablishmentWithQueueCount {
  id: string
  name: string
  slug: string
  category: string
  is_active: boolean
  created_at: string
  queue_count: number
}

export default function EstablishmentsPage() {
  const [establishments, setEstablishments] = useState<EstablishmentWithQueueCount[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadEstablishments()
  }, [])

  const loadEstablishments = async () => {
    const { data: ests } = await supabase
      .from('establishments')
      .select('*')
      .order('name')

    if (!ests) {
      setLoading(false)
      return
    }

    const estIds = ests.map((e: any) => e.id)

    const { data: queueCounts, error: qErr } = await supabase
      .from('queues')
      .select('establishment_id')
      .in('establishment_id', estIds)

    const countMap: Record<string, number> = {}
    if (queueCounts) {
      queueCounts.forEach((q: any) => {
        countMap[q.establishment_id] = (countMap[q.establishment_id] || 0) + 1
      })
    }

    const enriched = ests.map((e: any) => ({
      ...e,
      queue_count: countMap[e.id] || 0,
    }))

    setEstablishments(enriched)
    setLoading(false)
    toast.success(`${enriched.length} estabelecimento(s) carregado(s)`)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Carregando estabelecimentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estabelecimentos</h2>
          <p className="text-gray-600">Todos os estabelecimentos cadastrados</p>
        </div>
        <Link
          href="/establishment"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Novo Estabelecimento
        </Link>
      </div>

      {establishments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum estabelecimento cadastrado ainda</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {establishments.map((est) => (
            <div key={est.id} className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{est.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{est.slug}</p>
                </div>
                <span
                  className={
                    est.is_active
                      ? 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'
                      : 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700'
                  }
                >
                  {est.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>Categoria: {est.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-gray-400" />
                  <span>{est.queue_count} fila(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Criado em {formatDate(est.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Link
                  href={`/admin/dashboard?est=${est.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href={`/qr/${est.slug}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Link>
                <Link
                  href={`/admin/settings?est=${est.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Config
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Users2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}