'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Game, Establishment } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3, X, HelpCircle, Dices, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
        <form onSubmit={saveGame} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-scale-in space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {editingGameId ? 'Editar Jogo' : 'Criar Novo Jogo'}
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium">
              Tipo: {newGame.type}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Jogo
              </label>
              <input
                type="text"
                value={newGame.name}
                onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                placeholder="Ex: Quiz do Estabelecimento"
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
                <option value="quiz">Quiz (Perguntas e Respostas)</option>
                <option value="spin">Roleta da Sorte (Segmentos)</option>
                <option value="memory">Jogo da Memória (Emojis)</option>
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
                placeholder="Ex: Responda as perguntas e acumule pontos para trocar por prêmios!"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pontos de Recompensa (base)
              </label>
              <input
                type="number"
                value={newGame.points_reward}
                onChange={(e) => setNewGame({ ...newGame, points_reward: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                min="0"
              />
            </div>
          </div>

          {/* Type-Specific Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            {newGame.type === 'quiz' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-500" />
                      Perguntas do Quiz ({quizQuestions.length})
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Defina perguntas, opções e marque a resposta correta.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setQuizQuestions([
                        ...quizQuestions,
                        { q: '', options: ['Opção 1', 'Opção 2', 'Opção 3'], answer: 0 },
                      ])
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition"
                  >
                    + Adicionar Pergunta
                  </button>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((question, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          #{qIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={question.q}
                          onChange={(e) => {
                            const updated = [...quizQuestions]
                            updated[qIdx]!.q = e.target.value
                            setQuizQuestions(updated)
                          }}
                          placeholder="Digite a pergunta..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                          required
                        />
                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            aria-label="Remover pergunta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Opções de resposta (selecione a correta):
                        </label>
                        {question.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-answer-${qIdx}`}
                              checked={question.answer === oIdx}
                              onChange={() => {
                                const updated = [...quizQuestions]
                                updated[qIdx]!.answer = oIdx
                                setQuizQuestions(updated)
                              }}
                              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              title="Marcar como resposta correta"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions]
                                updated[qIdx]!.options[oIdx] = e.target.value
                                setQuizQuestions(updated)
                              }}
                              placeholder={`Opção ${oIdx + 1}`}
                              className="flex-1 px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              required
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...quizQuestions]
                                  updated[qIdx]!.options = question.options.filter((_, i) => i !== oIdx)
                                  if (updated[qIdx]!.answer >= updated[qIdx]!.options.length) {
                                    updated[qIdx]!.answer = 0
                                  }
                                  setQuizQuestions(updated)
                                }}
                                className="text-xs text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {question.options.length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...quizQuestions]
                              updated[qIdx]!.options.push('')
                              setQuizQuestions(updated)
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                          >
                            + Adicionar Opção
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newGame.type === 'spin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Dices className="h-4 w-4 text-amber-500" />
                      Segmentos da Roleta ({spinSegments.length})
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Configure os prêmios/pontos de cada fatia da roleta.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSpinSegments([...spinSegments, { label: 'Novo Prêmio', value: 10 }])
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 font-medium hover:bg-amber-100 transition"
                  >
                    + Adicionar Segmento
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {spinSegments.map((segment, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={segment.label}
                        onChange={(e) => {
                          const updated = [...spinSegments]
                          updated[sIdx]!.label = e.target.value
                          setSpinSegments(updated)
                        }}
                        placeholder="Rótulo (ex: 50 pts)"
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                      <input
                        type="number"
                        value={segment.value}
                        onChange={(e) => {
                          const updated = [...spinSegments]
                          updated[sIdx]!.value = parseInt(e.target.value) || 0
                          setSpinSegments(updated)
                        }}
                        placeholder="Pontos"
                        className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                      />
                      {spinSegments.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setSpinSegments(spinSegments.filter((_, i) => i !== sIdx))}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          aria-label="Remover segmento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newGame.type === 'memory' && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Emojis das Cartas de Memória
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Informe 4 a 8 emojis ou caracteres separados por vírgula para compor os pares de cartas.
                </p>
                <input
                  type="text"
                  value={memoryEmojis}
                  onChange={(e) => setMemoryEmojis(e.target.value)}
                  placeholder="🎮, 🎯, 🎨, 🎭, 🎪, 🎬"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg tracking-widest transition"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMemoryEmojis('🎮, 🎯, 🎨, 🎭, 🎪, 🎬')}
                    className="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    Preset Clássico
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryEmojis('🍕, 🍔, 🍟, 🍩, ☕, 🍦')}
                    className="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    Preset Comida
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryEmojis('⭐, 💎, 🚀, ⚡, 🎁, 🔥')}
                    className="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    Preset Prêmios
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-6 py-2.5 rounded-xl transition-all shadow-md font-medium"
            >
              {editingGameId ? 'Salvar Alterações' : 'Criar Jogo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingGameId(null)
              }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
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
