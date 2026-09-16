'use client'

import { Game } from '@/types'
import { Trash2, X, HelpCircle, Dices, Sparkles } from 'lucide-react'

interface QuizQuestion {
  q: string
  options: string[]
  answer: number
}

interface SpinSegment {
  label: string
  value: number
}

interface GameEditorProps {
  editingGameId: string | null
  newGame: { name: string; description: string; type: Game['type']; points_reward: number }
  quizQuestions: QuizQuestion[]
  spinSegments: SpinSegment[]
  memoryEmojis: string
  setNewGame: (game: { name: string; description: string; type: Game['type']; points_reward: number }) => void
  setQuizQuestions: (q: QuizQuestion[]) => void
  setSpinSegments: (s: SpinSegment[]) => void
  setMemoryEmojis: (e: string) => void
  setShowForm: (v: boolean) => void
  setEditingGameId: (id: string | null) => void
  onSave: (e: React.FormEvent) => void
}

export default function GameEditor({
  editingGameId,
  newGame,
  quizQuestions,
  spinSegments,
  memoryEmojis,
  setNewGame,
  setQuizQuestions,
  setSpinSegments,
  setMemoryEmojis,
  setShowForm,
  setEditingGameId,
  onSave,
}: GameEditorProps) {
  return (
    <form onSubmit={onSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-scale-in space-y-6">
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
  )
}
