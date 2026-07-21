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
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('name')

    if (data) setGames(data)
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
    const { error } = await supabase
      .from('games')
      .update({ is_active: !game.is_active })
      .eq('id', game.id)

    if (error) {
      toast.error(error.message || 'Erro ao alterar jogo')
      return
    }

    toast.success(game.is_active ? 'Jogo desativado' : 'Jogo ativado')
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
        <p className="text-gray-500 text-lg mb-4">Nenhum estabelecimento selecionado</p>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jogos</h2>
          <p className="text-gray-600">Gerencie os jogos de {establishment.name}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Novo Jogo
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGame} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Jogo
              </label>
              <input
                type="text"
                value={newGame.name}
                onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                placeholder="Ex: Quiz da Marca"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={newGame.type}
                onChange={(e) => setNewGame({ ...newGame, type: e.target.value as Game['type'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="quiz">Quiz</option>
                <option value="memory">Memória</option>
                <option value="spin">Roleta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={newGame.description}
                onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                placeholder="Descrição do jogo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pontos de Recompensa
              </label>
              <input
                type="number"
                value={newGame.points_reward}
                onChange={(e) => setNewGame({ ...newGame, points_reward: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Criar Jogo
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{game.name}</h3>
                <p className="text-sm text-gray-600">{game.description}</p>
              </div>
              <button
                onClick={() => toggleGame(game)}
                className={game.is_active ? 'text-green-600' : 'text-gray-400'}
              >
                {game.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Tipo: {game.type}</p>
                <p className="text-sm text-indigo-600 font-medium">+{game.points_reward} pts</p>
              </div>
              <button
                onClick={() => deleteGame(game.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum jogo criado ainda</p>
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
