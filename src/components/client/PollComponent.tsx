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
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-2">{poll.question}</h3>
      
      {!voted ? (
        <div className="space-y-2">
          {poll.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleVote(index)}
              className="w-full p-3 rounded-lg bg-white border-2 border-gray-200 text-left hover:border-indigo-500 transition"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (results[index] / totalVotes) * 100 : 0
            return (
              <div key={index} className="relative">
                <div
                  className="absolute inset-0 bg-indigo-100 rounded-lg transition-all"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative p-3 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    {index === selected && <Check className="h-4 w-4 text-green-600" />}
                    {option}
                  </span>
                  <span className="text-sm text-gray-600">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
            <Trophy className="h-4 w-4" />
            <span>+10 pontos por participar!</span>
          </div>
        </div>
      )}
    </div>
  )
}
