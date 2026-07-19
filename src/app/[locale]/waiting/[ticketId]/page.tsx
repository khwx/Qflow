'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClientComponentClient } from '@/lib/supabase'
import { Ticket, Game, Poll } from '@/types'
import { Gamepad2, ClipboardList, ShoppingCart, Trophy, Star } from 'lucide-react'
import GameModal from '@/components/client/GameModal'
import PollComponent from '@/components/client/PollComponent'
import OrderComponent from '@/components/client/OrderComponent'
import { cn } from '@/lib/utils'

type Tab = 'games' | 'polls' | 'orders'

export default function WaitingPage({ params }: { params: Promise<{ locale: string; ticketId: string }> }) {
  const { locale, ticketId } = use(params)
  const t = useTranslations('waiting')
  const tGames = useTranslations('games')
  const tPolls = useTranslations('polls')
  const tCalled = useTranslations('called')
  const tTicket = useTranslations('ticket')

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [establishment, setEstablishment] = useState<any>(null)
  const [games, setGames] = useState<Game[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [customerPoints, setCustomerPoints] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
    intervalRef.current = setInterval(checkStatus, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const loadData = async () => {
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('*, establishments(*)')
      .eq('id', ticketId)
      .single()

    if (ticketData) {
      setTicket(ticketData)
      setEstablishment(ticketData.establishments)

      const { data: gamesData } = await supabase
        .from('games')
        .select('*')
        .eq('establishment_id', ticketData.establishment_id)
        .eq('is_active', true)

      if (gamesData) setGames(gamesData)

      const { data: pollsData } = await supabase
        .from('polls')
        .select('*')
        .eq('establishment_id', ticketData.establishment_id)
        .eq('is_active', true)

      if (pollsData) setPolls(pollsData)
    }

    setLoading(false)
  }

  const checkStatus = async () => {
    if (!ticketId) return

    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (data && (data.status === 'called' || data.status === 'completed')) {
      setTicket(data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Senha não encontrada</p>
      </div>
    )
  }

  if (ticket.status === 'called') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔔</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tCalled('title')}</h1>
          <p className="text-gray-600 mb-6">{tCalled('subtitle')}</p>
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">{tTicket('your_ticket')}</p>
            <p className="text-3xl font-bold text-indigo-600">{ticket.ticket_number}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-gray-900">{establishment?.name}</h1>
            <p className="text-sm text-gray-600">{tTicket('your_ticket')}: {ticket.ticket_number}</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-yellow-700">{customerPoints} pts</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">{t('status')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('current_ticket')}</span>
                  <span className="font-semibold text-indigo-600">{ticket.ticket_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('position')}</span>
                  <span className="font-semibold">#{ticket.ticket_number.split('-')[1]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('status_label')}</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {t('waiting')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-6 w-6" />
                <h3 className="font-semibold">{t('earn_points')}</h3>
              </div>
              <p className="text-sm text-white/80 mb-4">
                {t('earn_points_desc')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b">
                <TabButton
                  icon={<Gamepad2 className="h-5 w-5" />}
                  label={t('games')}
                  active={activeTab === 'games'}
                  onClick={() => setActiveTab('games')}
                  count={games.length}
                />
                <TabButton
                  icon={<ClipboardList className="h-5 w-5" />}
                  label={t('polls')}
                  active={activeTab === 'polls'}
                  onClick={() => setActiveTab('polls')}
                  count={polls.length}
                />
                <TabButton
                  icon={<ShoppingCart className="h-5 w-5" />}
                  label={t('orders')}
                  active={activeTab === 'orders'}
                  onClick={() => setActiveTab('orders')}
                />
              </div>

              <div className="p-6">
                {activeTab === 'games' && (
                  <div>
                    {games.length === 0 ? (
                      <EmptyState
                        icon={<Gamepad2 className="h-12 w-12" />}
                        title={t('no_games')}
                        description={t('no_games_desc')}
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {games.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => setSelectedGame(game)}
                            className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 text-left transition"
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">{game.name}</h3>
                            {game.description && (
                              <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-indigo-600">
                              <Trophy className="h-4 w-4" />
                              <span>+{game.points_reward} {tGames('points')}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'polls' && (
                  <div>
                    {polls.length === 0 ? (
                      <EmptyState
                        icon={<ClipboardList className="h-12 w-12" />}
                        title={t('no_polls')}
                        description={t('no_polls_desc')}
                      />
                    ) : (
                      <div className="space-y-4">
                        {polls.map((poll) => (
                          <PollComponent
                            key={poll.id}
                            poll={poll}
                            ticketId={ticket.id}
                            onComplete={(points) => setCustomerPoints(p => p + points)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <OrderComponent
                    ticketId={ticket.id}
                    establishmentId={ticket.establishment_id}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          ticketId={ticket.id}
          onClose={() => setSelectedGame(null)}
          onComplete={(points) => {
            setCustomerPoints(p => p + points)
            setSelectedGame(null)
          }}
        />
      )}
    </div>
  )
}

function TabButton({ icon, label, active, onClick, count }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition',
        active ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}

function EmptyState({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 flex justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
