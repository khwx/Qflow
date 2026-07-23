'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Game } from '@/types'
import { X, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface GameModalProps {
  game: Game
  ticketId: string
  onClose: () => void
  onComplete: (points: number) => void
}

export default function GameModal({ game, ticketId, onClose, onComplete }: GameModalProps) {
  const t = useTranslations('games')
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const completeGame = async (finalScore: number) => {
    await supabase.from('game_scores').insert({
      game_id: game.id,
      ticket_id: ticketId,
      score: finalScore,
      max_score: 100,
    })

    onComplete(game.points_reward)
    setIsComplete(true)
  }

  if (game.type === 'memory') {
    return <MemoryGame game={game} onComplete={completeGame} onClose={onClose} />
  }

  if (game.type === 'quiz') {
    return <QuizGame game={game} onComplete={completeGame} onClose={onClose} />
  }

  if (game.type === 'spin') {
    return <SpinWheelGame game={game} onComplete={completeGame} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">{game.name}</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{game.description}</p>
        <button
          onClick={() => completeGame(100)}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          {t('play_demo')}
        </button>
      </div>
    </div>
  )
}

function MemoryGame({ game, onComplete, onClose }: {
  game: Game
  onComplete: (score: number) => void
  onClose: () => void
}) {
  const t = useTranslations('games')
  const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬']
  const [cards, setCards] = useState(() => shuffleArray([...emojis, ...emojis]).slice(0, 8))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  function shuffleArray(array: string[]) {
    return array.sort(() => Math.random() - 0.5)
  }

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped])
        setFlipped([])
        
        if (matched.length + 2 === cards.length) {
          const points = Math.max(0, 100 - moves * 5)
          setTimeout(() => onComplete(points), 500)
        }
      } else {
        setTimeout(() => setFlipped([]), 800)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{game.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {cards.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              className={`
                aspect-square rounded-xl text-3xl flex items-center justify-center
                transition-all duration-300 transform
                ${flipped.includes(index) || matched.includes(index)
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 rotate-0 scale-100'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 rotate-180 hover:scale-105'
                }
              `}
            >
              {(flipped.includes(index) || matched.includes(index)) ? emoji : '?'}
            </button>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('moves', { count: moves })}
        </div>
      </div>
    </div>
  )
}

function QuizGame({ game, onComplete, onClose }: {
  game: Game
  onComplete: (score: number) => void
  onClose: () => void
}) {
  const t = useTranslations('games')
  const questions: { q: string; options: string[]; answer: number }[] = (game.config as { questions?: { q: string; options: string[]; answer: number }[] }).questions || [
    { q: 'Qual fruta é vermelha e redonda?', options: ['Maçã', 'Banana', 'Uva'], answer: 0 },
    { q: 'Quantas pernas tem uma aranha?', options: ['4', '6', '8'], answer: 2 },
    { q: 'Qual é o maior planeta?', options: ['Terra', 'Júpiter', 'Marte'], answer: 1 },
  ]

  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const handleAnswer = (index: number) => {
    setSelected(index)
    if (index === questions[current].answer) {
      setScore(s => s + 1)
    }

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1)
        setSelected(null)
      } else {
        const points = Math.round((score / questions.length) * 100)
        onComplete(points)
      }
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{game.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{t('question', { current: current + 1, total: questions.length })}</span>
            <span>{t('points', { count: score })}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{questions[current].q}</h3>

        <div className="space-y-2">
          {questions[current].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selected !== null}
              className={`
                w-full p-4 rounded-xl text-left transition-all transform
                ${selected === null
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                  : selected === index
                    ? index === questions[current].answer
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpinWheelGame({ game, onComplete, onClose }: {
  game: Game
  onComplete: (score: number) => void
  onClose: () => void
}) {
  const t = useTranslations('games')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const segments: { label: string; value: number }[] = (game.config as { segments?: { label: string; value: number }[] }).segments || [
    { label: '10 pts', value: 10 },
    { label: '20 pts', value: 20 },
    { label: '50 pts', value: 50 },
    { label: '100 pts', value: 100 },
    { label: 'Tente de novo', value: 0 },
    { label: '30 pts', value: 30 },
  ]

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    const newRotation = rotation + Math.random() * 360 + 720
    setRotation(newRotation)

    setTimeout(() => {
      const normalized = newRotation % 360
      const segmentIndex = Math.floor((360 - normalized + 90) / (360 / segments.length)) % segments.length
      const points = segments[segmentIndex].value
      onComplete(points)
      setSpinning(false)
    }, 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{game.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative w-64 h-64 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full border-8 border-indigo-600 transition-transform duration-[3000ms] ease-out shadow-2xl"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {segments.map((segment, i) => (
              <div
                key={i}
                className="absolute w-1/2 h-1/2 origin-bottom-right"
                style={{
                  transform: `rotate(${(360 / segments.length) * i}deg)`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                }}
              >
                <div
                  className="absolute top-4 left-4 text-xs font-bold text-white drop-shadow-md"
                  style={{ transform: `rotate(${45 + (360 / segments.length) * i}deg)` }}
                >
                  {segment.label}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
        >
          {spinning ? t('spinning') : t('spin')}
        </button>
      </div>
    </div>
  )
}
