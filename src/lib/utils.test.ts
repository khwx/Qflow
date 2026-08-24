import { describe, it, expect } from 'vitest'
import { computeAvgWaitMinutes, computeAvgServiceMinutes } from './utils'

describe('computeAvgWaitMinutes', () => {
  it('returns 0 when there are no called tickets', () => {
    expect(computeAvgWaitMinutes([{ created_at: '2026-01-01T10:00:00Z', called_at: null }])).toBe(0)
  })

  it('returns 0 for an empty list', () => {
    expect(computeAvgWaitMinutes([])).toBe(0)
  })

  it('computes the average wait from created_at to called_at', () => {
    const tickets = [
      { created_at: '2026-01-01T10:00:00Z', called_at: '2026-01-01T10:10:00Z' },
      { created_at: '2026-01-01T10:00:00Z', called_at: '2026-01-01T10:20:00Z' },
    ]
    expect(computeAvgWaitMinutes(tickets)).toBe(15)
  })

  it('ignores negative waits (called before created)', () => {
    const tickets = [
      { created_at: '2026-01-01T10:10:00Z', called_at: '2026-01-01T10:00:00Z' },
      { created_at: '2026-01-01T10:00:00Z', called_at: '2026-01-01T10:30:00Z' },
    ]
    expect(computeAvgWaitMinutes(tickets)).toBe(30)
  })
})

describe('computeAvgServiceMinutes', () => {
  it('returns 0 when there are no completed tickets', () => {
    expect(computeAvgServiceMinutes([{ called_at: null, completed_at: null }])).toBe(0)
  })

  it('computes the average service time from called_at to completed_at', () => {
    const tickets = [
      { called_at: '2026-01-01T10:10:00Z', completed_at: '2026-01-01T10:25:00Z' },
      { called_at: '2026-01-01T10:10:00Z', completed_at: '2026-01-01T10:15:00Z' },
    ]
    expect(computeAvgServiceMinutes(tickets)).toBe(10)
  })
})
