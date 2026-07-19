'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Game } from '@/types'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

export default function GamesPage() {
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
    loadGames()
  }, [])

  const loadGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('name')

    if (data) setGames(data)
  }

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await supabase.from('games').insert({
      ...newGame,
      config: newGame.type === 'quiz' ? {
        questions: [
          { q: 'Pergunta exemplo 1?', options: ['A', 'B', 'C'], answer: 0 },
          { q: 'Pergunta exemplo 2?', options: ['A', 'B', 'C'], answer: 1 },
        ]
      } : {},
    })

    setNewGame({ name: '', description: '', type: 'quiz', points_reward: 10 })
    setShowForm(false)
    loadGames()
  }

  const toggleGame = async (game: Game) => {
    await supabase
      .from('games')
      .update({ is_active: !game.is_active })
      .eq('id', game.id)

    loadGames()
  }

  const deleteGame = async (id: string) => {
    await supabase.from('games').delete().eq('id', id)
    loadGames()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jogos</h2>
          <p className="text-gray-600">Gerencie os jogos disponíveis para os clientes</p>
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
