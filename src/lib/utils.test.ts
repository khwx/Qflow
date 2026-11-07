import { describe, it, expect } from 'vitest'
import { computeAvgWaitMinutes, computeAvgServiceMinutes, timeAgo, formatDatePortuguese } from './utils'

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

describe('timeAgo', () => {
  it('returns "ainda agora" for future dates', () => {
    expect(timeAgo('2099-01-01T00:00:00Z')).toBe('ainda agora')
  })

  it('returns "1 segundo atrás" for 1 second ago', () => {
    const oneSecondAgo = new Date(Date.now() - 1000).toISOString()
    expect(timeAgo(oneSecondAgo)).toBe('1 segundo atrás')
  })

  it('returns "{n} segundos atrás" for multiple seconds', () => {
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
    expect(timeAgo(fiveSecondsAgo)).toBe('5 segundos atrás')
  })

  it('returns "1 min atrás" for 1 minute ago', () => {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    expect(timeAgo(oneMinuteAgo)).toBe('1 min atrás')
  })

  it('returns "{n} min atrás" for multiple minutes', () => {
    const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString()
    expect(timeAgo(fiveMinutesAgo)).toBe('5 min atrás')
  })

  it('returns "1 hora atrás" for 1 hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    expect(timeAgo(oneHourAgo)).toBe('1 hora atrás')
  })

  it('returns "{n} horas atrás" for multiple hours', () => {
    const fiveHoursAgo = new Date(Date.now() - 18000000).toISOString()
    expect(timeAgo(fiveHoursAgo)).toBe('5 horas atrás')
  })

  it('returns "1 dia atrás" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
    expect(timeAgo(oneDayAgo)).toBe('1 dia atrás')
  })

  it('returns "{n} dias atrás" for multiple days', () => {
    const threeDaysAgo = new Date(Date.now() - 259200000).toISOString()
    expect(timeAgo(threeDaysAgo)).toBe('3 dias atrás')
  })

  it('returns "1 semana atrás" for 1 week ago', () => {
    const oneWeekAgo = new Date(Date.now() - 604800000).toISOString()
    expect(timeAgo(oneWeekAgo)).toBe('1 semana atrás')
  })

  it('returns "{n} semanas atrás" for multiple weeks', () => {
    const eightWeeksAgo = new Date(Date.now() - 604800000 * 8).toISOString()
    expect(timeAgo(eightWeeksAgo)).toBe('8 semanas atrás')
  })
})

describe('formatDatePortuguese', () => {
  it('formats a date in Portuguese format', () => {
    expect(formatDatePortuguese('2024-03-14T14:30:00Z')).toBe('14 de mar. de 2024, 14:30')
  })

  it('handles current date', () => {
    expect(formatDatePortuguese(new Date().toISOString())).toMatch(/\d{2}\s+de\s+\w+\.\s+de\s+\d{4},\s+\d{2}:\d{2}/)
  })

  it('handles date with different times', () => {
    expect(formatDatePortuguese('2024-01-01T00:00:00Z')).toMatch(/\d{2}\s+de\s+\w+\.\s+de\s+\d{4}/)
  })
})
