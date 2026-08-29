'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Customer, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Search, Trash2, Save } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

function CustomersContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!estSlug)
  const [savingId, setSavingId] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const loadCustomers = useCallback(async (establishmentId: string) => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('total_points', { ascending: false })

      if (data) {
        let filtered = data as Customer[]
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q) ||
              c.phone?.toLowerCase().includes(q)
          )
        }
        setCustomers(filtered)
      }
    } catch (error) {
      console.error('Load customers error:', error)
    } finally {
      setLoading(false)
    }
  }, [search, supabase])

  useEffect(() => {
    if (estSlug) {
      supabase
        .from('establishments')
        .select('*')
        .eq('slug', estSlug)
        .single()
        .then(({ data }) => {
          setEstablishment(data)
          if (data) queueMicrotask(() => loadCustomers(data.id))
        })
    }
  }, [estSlug, supabase, loadCustomers])

  useEffect(() => {
    if (establishment) {
      queueMicrotask(() => loadCustomers(establishment.id))
    }
  }, [establishment, loadCustomers])

  const saveCustomer = async (
    id: string,
    total_points: number,
    total_visits: number
  ) => {
    setSavingId(id)
    const { error } = await supabase
      .from('customers')
      .update({ total_points, total_visits, updated_at: new Date().toISOString() })
      .eq('id', id)

    setSavingId(null)
    if (error) {
      toast.error(error.message || 'Erro ao salvar cliente')
      return
    }
    toast.success('Cliente atualizado')
    if (establishment) loadCustomers(establishment.id)
  }

  const deleteCustomer = async (id: string) => {
    if (!window.confirm('Remover este cliente? Esta ação não pode ser desfeita.')) {
      return
    }
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      toast.error(error.message || 'Erro ao remover cliente')
      return
    }
    toast.success('Cliente removido')
    if (establishment) loadCustomers(establishment.id)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!estSlug || !establishment) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nenhum estabelecimento selecionado</p>
        <Link
          href="/admin/establishments"
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
        >
          Selecionar estabelecimento
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
          <p className="text-gray-600 dark:text-gray-400">Fidelização e pontos de {establishment.name}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visitas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pontos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer: Customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                saving={savingId === customer.id}
                onSave={saveCustomer}
                onDelete={deleteCustomer}
              />
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CustomerRow({
  customer,
  saving,
  onSave,
  onDelete,
}: {
  customer: Customer
  saving: boolean
  onSave: (id: string, total_points: number, total_visits: number) => void
  onDelete: (id: string) => void
}) {
  const [points, setPoints] = useState(customer.total_points)
  const [visits, setVisits] = useState(customer.total_visits)

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {customer.name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div>{customer.email || '-'}</div>
        <div>{customer.phone || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          min={0}
          value={visits}
          onChange={(e) => setVisits(Number(e.target.value))}
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          min={0}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <button
            onClick={() => onSave(customer.id, points, visits)}
            disabled={saving}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Salvar"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(customer.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <CustomersContent />
    </Suspense>
  )
}
