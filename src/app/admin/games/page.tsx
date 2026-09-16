'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@/lib/supabase'
import { Game, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const GameEditor = dynamic(() => import('@/components/admin/GameEditor'))

interface QuizQuestion {
  q: string
  options: string[]
  answer: number
}

interface SpinSegment {
  label: string
  value: number
}

const DEFAULT_QUIZ: QuizQuestion[] = [
  { q: 'Pergunta 1', options: ['Opção A', 'Opção B', 'Opção C'], answer: 0 },
]

const DEFAULT_SPIN: SpinSegment[] = [
  { label: '10 pts', value: 10 },
  { label: '20 pts', value: 20 },
  { label: '50 pts', value: 50 },
  { label: '100 pts', value: 100 },
  { label: 'Tente de novo', value: 0 },
  { label: '30 pts', value: 30 },
]

const DEFAULT_MEMORY_EMOJIS = '🎮, 🎯, 🎨, 🎭, 🎪, 🎬'

function GamesContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [newGame, setNewGame] = useState({
    name: '',
    description: '',
    type: 'quiz' as Game['type'],
    points_reward: 10,
  })

  // Game config state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ)
  const [spinSegments, setSpinSegments] = useState<SpinSegment[]>(DEFAULT_SPIN)
  const [memoryEmojis, setMemoryEmojis] = useState(DEFAULT_MEMORY_EMOJIS)

  const supabase = createClientComponentClient()

  const loadGames = useCallback(async (establishmentId: string) => {
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
  }, [supabase])

  useEffect(() => {
    if (estSlug) {
      supabase
        .from('establishments')
        .select('*')
        .eq('slug', estSlug)
        .single()
        .then(({ data }) => {
          setEstablishment(data)
          if (data) queueMicrotask(() => loadGames(data.id))
        })
    }
  }, [estSlug, supabase, loadGames])

  const openCreateForm = () => {
    setEditingGameId(null)
    setNewGame({ name: '', description: '', type: 'quiz', points_reward: 10 })
    setQuizQuestions([
      { q: 'Qual o nosso principal produto?', options: ['Opção 1', 'Opção 2', 'Opção 3'], answer: 0 },
    ])
    setSpinSegments(DEFAULT_SPIN)
    setMemoryEmojis(DEFAULT_MEMORY_EMOJIS)
    setShowForm(true)
  }

  const openEditForm = (game: Game) => {
    setEditingGameId(game.id)
    setNewGame({
      name: game.name,
      description: game.description || '',
      type: game.type,
      points_reward: game.points_reward,
    })

    const config = (game.config || {}) as {
      questions?: QuizQuestion[]
      segments?: SpinSegment[]
      emojis?: string[]
    }

    if (game.type === 'quiz') {
      setQuizQuestions(config.questions && config.questions.length > 0 ? config.questions : DEFAULT_QUIZ)
    } else if (game.type === 'spin') {
      setSpinSegments(config.segments && config.segments.length > 0 ? config.segments : DEFAULT_SPIN)
    } else if (game.type === 'memory') {
      setMemoryEmojis(config.emojis ? config.emojis.join(', ') : DEFAULT_MEMORY_EMOJIS)
    }

    setShowForm(true)
  }

  const buildConfig = (): Record<string, unknown> | null => {
    if (newGame.type === 'quiz') {
      const validQuestions = quizQuestions
        .map((q) => ({
          q: q.q.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          answer: Math.max(0, Math.min(q.answer, q.options.length - 1)),
        }))
        .filter((q) => q.q.length > 0 && q.options.length >= 2)

      if (validQuestions.length === 0) {
        toast.error('O quiz precisa de pelo menos 1 pergunta válida com 2+ opções')
        return null
      }
      return { questions: validQuestions }
    }

    if (newGame.type === 'spin') {
      const validSegments = spinSegments
        .map((s) => ({ label: s.label.trim(), value: Number(s.value) || 0 }))
        .filter((s) => s.label.length > 0)

      if (validSegments.length < 2) {
        toast.error('A roleta precisa de pelo menos 2 segmentos com rótulos')
        return null
      }
      return { segments: validSegments }
    }

    if (newGame.type === 'memory') {
      const emojis = memoryEmojis
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter(Boolean)

      if (emojis.length < 4) {
        toast.error('O jogo da memória precisa de pelo menos 4 emojis/símbolos')
        return null
      }
      return { emojis: emojis.slice(0, 8) }
    }

    return {}
  }

  const saveGame = async (e: React.FormEvent) => {
    e.preventDefault()

    const config = buildConfig()
    if (!config) return

    if (editingGameId) {
      const { error } = await supabase
        .from('games')
        .update({
          name: newGame.name.trim(),
          description: newGame.description.trim() || null,
          type: newGame.type,
          points_reward: newGame.points_reward,
          config,
        })
        .eq('id', editingGameId)

      if (error) {
        toast.error(error.message || 'Erro ao atualizar jogo')
        return
      }

      toast.success('Jogo atualizado com sucesso!')
    } else {
      const { error } = await supabase.from('games').insert({
        name: newGame.name.trim(),
        description: newGame.description.trim() || null,
        type: newGame.type,
        points_reward: newGame.points_reward,
        establishment_id: establishment!.id,
        config,
      })

      if (error) {
        toast.error(error.message || 'Erro ao criar jogo')
        return
      }

      toast.success('Jogo criado com sucesso!')
    }

    setShowForm(false)
    setEditingGameId(null)
    loadGames(establishment!.id)
  }

  const toggleGame = async (game: Game) => {
    const newActive = !game.is_active

    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, is_active: newActive } : g))
    )

    const { error } = await supabase
      .from('games')
      .update({ is_active: newActive })
      .eq('id', game.id)

    if (error) {
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, is_active: game.is_active } : g))
      )
      toast.error(error.message || 'Erro ao atualizar jogo')
      return
    }

    toast.success(newActive ? 'Jogo ativado com sucesso!' : 'Jogo desativado com sucesso!')
    if (establishment) loadGames(establishment.id)
  }

  const deleteGame = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) return

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-stitch">Jogos & Gamificação</h2>
          <p className="text-gray-600 dark:text-gray-400">Configure jogos personalizados para {establishment.name}</p>
        </div>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreateForm}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl transition-all shadow-sm hover:scale-105"
        >
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? 'Fechar' : 'Novo Jogo'}
        </button>
      </div>

      {showForm && (
        <GameEditor
          editingGameId={editingGameId}
          newGame={newGame}
          quizQuestions={quizQuestions}
          spinSegments={spinSegments}
          memoryEmojis={memoryEmojis}
          setNewGame={setNewGame}
          setQuizQuestions={setQuizQuestions}
          setSpinSegments={setSpinSegments}
          setMemoryEmojis={setMemoryEmojis}
          setShowForm={setShowForm}
          setEditingGameId={setEditingGameId}
          onSave={saveGame}
        />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{game.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{game.description || 'Sem descrição'}</p>
                </div>
                <button
                  onClick={() => toggleGame(game)}
                  aria-label={game.is_active ? 'Desativar jogo' : 'Ativar jogo'}
                  aria-pressed={game.is_active}
                  className={game.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}
                  title={game.is_active ? 'Jogo ativo' : 'Jogo inativo'}
                >
                  {game.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </div>

              <div className="my-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{game.type}</span>
                </div>
                {game.type === 'quiz' && (
                  <div className="flex justify-between">
                    <span>Perguntas:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {((game.config as { questions?: unknown[] })?.questions?.length) || 0}
                    </span>
                  </div>
                )}
                {game.type === 'spin' && (
                  <div className="flex justify-between">
                    <span>Segmentos:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {((game.config as { segments?: unknown[] })?.segments?.length) || 0}
                    </span>
                  </div>
                )}
                {game.type === 'memory' && (
                  <div className="flex justify-between">
                    <span>Pares:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {((game.config as { emojis?: string[] })?.emojis?.join(' ')) || 'Padrão'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">+{game.points_reward} pts</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditForm(game)}
                  aria-label={`Editar jogo ${game.name}`}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Editar configurações"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteGame(game.id)}
                  aria-label={`Excluir jogo ${game.name}`}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
