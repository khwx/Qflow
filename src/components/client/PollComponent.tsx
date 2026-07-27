'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Poll } from '@/types'
import { Check, Trophy } from 'lucide-react'

interface PollComponentProps {
  poll: Poll
  ticketId: string
  onComplete: (points: number) => void
}

export default function PollComponent({ poll, ticketId, onComplete }: PollComponentProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [voted, setVoted] = useState(false)
  const [results, setResults] = useState<number[]>([])
  const supabase = createClientComponentClient()

  const handleVote = async (optionIndex: number) => {
    if (voted) return

    await supabase.from('poll_responses').insert({
      poll_id: poll.id,
      ticket_id: ticketId,
      option_index: optionIndex,
    })

    setSelected(optionIndex)
    setVoted(true)

    const { data } = await supabase
      .from('poll_responses')
      .select('option_index')
      .eq('poll_id', poll.id)

    if (data) {
      const counts = poll.options.map((_, i) => 
        data.filter(r => r.option_index === i).length
      )
      setResults(counts)
    }

    onComplete(10)
  }

  const totalVotes = results.reduce((a, b) => a + b, 0)

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{poll.question}</h3>
      
      {!voted ? (
        <div className="space-y-2">
          {poll.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleVote(index)}
              className="w-full p-4 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-left hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-gray-900 dark:text-white"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((results[index] / totalVotes) * 100) : 0
            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {index === selected && <Check className="h-4 w-4 text-green-500" />}
                    {option}
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-2 mt-4 text-sm text-green-600 dark:text-green-400">
            <Trophy className="h-4 w-4" />
            <span>+10 pontos por participar!</span>
          </div>
        </div>
      )}
    </div>
  )
}
