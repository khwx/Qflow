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

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 11
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tEnter('not_found')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{tEnter('not_found_desc')}</p>
        </div>
      </div>
    )
  }

  if (ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
        <div className="max-w-lg mx-auto pt-20 animate-scale-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tTicket('confirmed')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{establishment.name}</p>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-6 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{tTicket('your_ticket')}</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{ticket.ticket_number}</p>
            </div>

            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>{tTicket('estimated_wait')}: {getEstimatedWait(queues[0]?.current_number || 0, ticket.ticket_number)} {tTicket('min')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>{tTicket('queue_position')}: {queues[0]?.current_number || 0}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/waiting/${ticket.id}`)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            {establishment.logo_url ? (
              <img src={establishment.logo_url} alt={establishment.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold text-white">{establishment.name[0]}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{establishment.name}</h1>
          <p className="text-white/80">{establishment.description || t('select_queue')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('select_queue')}</h2>
          
          <div className="space-y-3">
            {queues.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('no_queues')}</p>
              </div>
            )}
            {queues.map((queue) => (
              <button
                key={queue.id}
                onClick={() => setSelectedQueue(queue)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  selectedQueue?.id === queue.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{queue.name}</h3>
                    {queue.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{queue.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('optional_info')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={() => {
                    if (customerPhone && !validatePhone(customerPhone)) {
                      toast.error('Número de telefone inválido')
                    }
                  }}
                  placeholder={t('phone_placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formato: (00) 00000-0000</p>
              </div>

              <button
                onClick={takeTicket}
                disabled={takingTicket}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
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
