'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Game, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function GamesContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newGame, setNewGame] = useState({
    name: '',
    description: '',
    type: 'quiz' as Game['type'],
    points_reward: 10,
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (estSlug) {
      supabase
        .from('establishments')
        .select('*')
        .eq('slug', estSlug)
        .single()
        .then(({ data }) => {
          setEstablishment(data)
          if (data) loadGames(data.id)
        })
    }
  }, [estSlug])

  const loadGames = async (establishmentId: string) => {
    try {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name')

      if (data) setGames(data)
    } catch (error) {
      console.error('Load games error:', error)
    }
  }

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.from('games').insert({
      ...newGame,
      establishment_id: establishment!.id,
      config: newGame.type === 'quiz' ? {
        questions: [
          { q: 'Pergunta exemplo 1?', options: ['A', 'B', 'C'], answer: 0 },
          { q: 'Pergunta exemplo 2?', options: ['A', 'B', 'C'], answer: 1 },
        ]
      } : {},
    })

    if (error) {
      toast.error(error.message || 'Erro ao criar jogo')
      return
    }

    toast.success('Jogo criado com sucesso!')
    setNewGame({ name: '', description: '', type: 'quiz', points_reward: 10 })
    setShowForm(false)
    loadGames(establishment!.id)
  }

  const toggleGame = async (game: Game) => {
    const newActive = !game.is_active

    setGames(prev =>
      prev.map(g => g.id === game.id ? { ...g, is_active: newActive } : g)
    )

    const { error } = await supabase
      .from('games')
      .update({ is_active: newActive })
      .eq('id', game.id)

    if (error) {
      setGames(prev =>
        prev.map(g => g.id === game.id ? { ...g, is_active: game.is_active } : g)
      )
      toast.error(error.message || 'Erro ao atualizar jogo')
      return
    }

    toast.success(newActive ? 'Jogo ativado com sucesso!' : 'Jogo desativado com sucesso!')
    if (establishment) loadGames(establishment.id)
  }

  const deleteGame = async (id: string) => {
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) {
      toast.error(error.message || 'Erro ao excluir jogo')
      return
    }
    toast.success('Jogo excluído com sucesso!')
    if (establishment) loadGames(establishment.id)
  }

  if (!estSlug || !establishment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nenhum estabelecimento selecionado</p>
        <Link
          href="/admin/establishments"
          className="text-indigo-600 hover:text-indigo-800 underline"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jogos</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os jogos de {establishment.name}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl transition-all shadow-sm hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Novo Jogo
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGame} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-scale-in">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Jogo
              </label>
              <input
                type="text"
                value={newGame.name}
                onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                placeholder="Ex: Quiz da Marca"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={newGame.type}
                onChange={(e) => setNewGame({ ...newGame, type: e.target.value as Game['type'] })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
              >
                <option value="quiz">Quiz</option>
                <option value="memory">Memória</option>
                <option value="spin">Roleta</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={newGame.description}
                onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                placeholder="Descrição do jogo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pontos de Recompensa
              </label>
              <input
                type="number"
                value={newGame.points_reward}
                onChange={(e) => setNewGame({ ...newGame, points_reward: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl transition-all"
            >
              Criar Jogo
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{game.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{game.description}</p>
              </div>
              <button
                onClick={() => toggleGame(game)}
                aria-label={game.is_active ? 'Desativar jogo' : 'Ativar jogo'}
                aria-pressed={game.is_active}
                className={game.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}
              >
                {game.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo: {game.type}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">+{game.points_reward} pts</p>
              </div>
              <button
                onClick={() => deleteGame(game.id)}
                aria-label={`Excluir jogo ${game.name}`}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Nenhum jogo criado ainda</p>
        </div>
      )}
    </div>
  )
}

export default function GamesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <GamesContent />
    </Suspense>
  )
}
