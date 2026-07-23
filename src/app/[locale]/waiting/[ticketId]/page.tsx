'use client'

import { use, useState, useEffect } from 'react'
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
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('ticket-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicket(payload.new as Ticket)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadData = async () => {
    try {
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
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
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
        <p className="text-gray-600">{t('ticket_not_found')}</p>
      </div>
    )
  }

  if (ticket.status === 'called') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-lg animate-scale-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <span className="text-4xl">🔔</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{tCalled('title')}</h1>
          <p className="text-xl text-gray-600 mb-8">{tCalled('subtitle')}</p>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8">
            <p className="text-sm text-gray-500 mb-2">{tTicket('your_ticket')}</p>
            <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {ticket.ticket_number}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">{t('please_proceed', { default: 'Please proceed to the counter' })}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">{establishment?.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tTicket('your_ticket')}: {ticket.ticket_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <Trophy className="h-5 w-5 text-white" />
              <span className="font-bold text-white">{customerPoints} pts</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('status')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('current_ticket')}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{ticket.ticket_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('position')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{ticket.ticket_number.split('-')[1]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('status_label')}</span>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                    {t('waiting')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-sm p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{t('earn_points')}</h3>
              </div>
              <p className="text-sm text-white/80 mb-4">
                {t('earn_points_desc')}
              </p>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{customerPoints}</p>
                <p className="text-xs text-white/70">pontos ganhos</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
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
                  <div className="animate-fade-in">
                    {games.length === 0 ? (
                      <EmptyState
                        icon={<Gamepad2 className="h-12 w-12" />}
                        title={t('no_games')}
                        description={t('no_games_desc')}
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {games.map((game, index) => (
                          <button
                            key={game.id}
                            onClick={() => setSelectedGame(game)}
                            className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{game.name}</h3>
                            {game.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{game.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
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
                  <div className="animate-fade-in">
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
                  <div className="animate-fade-in">
                    <OrderComponent
                      ticketId={ticket.id}
                      establishmentId={ticket.establishment_id}
                    />
                  </div>
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
        'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all',
        active
          ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          active
            ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        )}>
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
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">{description}</p>
    </div>
  )
}
