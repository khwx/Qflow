'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { Establishment, Queue, Ticket } from '@/types'
import { cn, generateTicketNumber, getEstimatedWait } from '@/lib/utils'
import toast from 'react-hot-toast'
import { QrCode, Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function QueuePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = use(params)
  const t = useTranslations('queue')
  const tTicket = useTranslations('ticket')
  const tEnter = useTranslations('enter')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [takingTicket, setTakingTicket] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!code) {
      router.push('/enter')
      return
    }
    loadData()
  }, [code])

  const loadData = async () => {
    const { data: est } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', code.toLowerCase())
      .eq('is_active', true)
      .single()

    if (est) {
      setEstablishment(est)
      
      const { data: queueData } = await supabase
        .from('queues')
        .select('*')
        .eq('establishment_id', est.id)
        .eq('is_active', true)
        .order('name')

      if (queueData) {
        setQueues(queueData)
      }
    }

    setLoading(false)
  }

  const takeTicket = async () => {
    if (!selectedQueue) return
    
    setTakingTicket(true)
    
    const newNumber = selectedQueue.current_number + 1
    const ticketNumber = generateTicketNumber(
      selectedQueue.name.substring(0, 3).toUpperCase(),
      newNumber
    )

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        queue_id: selectedQueue.id,
        establishment_id: establishment!.id,
        ticket_number: ticketNumber,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      toast.error(error.message || tTicket('error_creating'))
      setTakingTicket(false)
      return
    }

    await supabase
      .from('queues')
      .update({ current_number: newNumber })
      .eq('id', selectedQueue.id)

    setTicket(data)
    setTakingTicket(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tEnter('not_found')}</h1>
          <p className="text-gray-600">{tEnter('not_found_desc')}</p>
        </div>
      </div>
    )
  }

  if (ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-lg mx-auto pt-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{tTicket('confirmed')}</h2>
            <p className="text-gray-600 mb-6">{establishment.name}</p>
            
            <div className="bg-indigo-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-1">{tTicket('your_ticket')}</p>
              <p className="text-4xl font-bold text-indigo-600">{ticket.ticket_number}</p>
            </div>

            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span>{tTicket('estimated_wait')}: {getEstimatedWait(queues[0]?.current_number || 0, ticket.ticket_number)} {tTicket('min')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>{tTicket('queue_position')}: {queues[0]?.current_number || 0}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/waiting/${ticket.id}`)}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              {tTicket('waiting_room')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
      <div className="max-w-lg mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            {establishment.logo_url ? (
              <img src={establishment.logo_url} alt={establishment.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold text-indigo-600">{establishment.name[0]}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{establishment.name}</h1>
          <p className="text-white/80">{establishment.description || t('select_queue')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('select_queue')}</h2>
          
          <div className="space-y-3">
            {queues.map((queue) => (
              <button
                key={queue.id}
                onClick={() => setSelectedQueue(queue)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition',
                  selectedQueue?.id === queue.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{queue.name}</h3>
                    {queue.description && (
                      <p className="text-sm text-gray-600 mt-1">{queue.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">~{queue.estimated_wait_minutes || 5} {t('minutes')}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedQueue && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('optional_info')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t('phone_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={takeTicket}
                disabled={takingTicket}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {takingTicket ? t('taking') : t('take_ticket')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
