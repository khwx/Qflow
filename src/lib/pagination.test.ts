import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAGE_SIZE,
  jsonWithPagination,
  parsePagination,
} from './pagination'

describe('parsePagination', () => {
  it('defaults to 50/0 when no params are given', () => {
    const result = parsePagination(new URLSearchParams())
    expect(result).toEqual({ limit: DEFAULT_PAGE_SIZE, offset: 0 })
  })

  it('honours an explicit limit', () => {
    const result = parsePagination(new URLSearchParams('limit=10'))
    expect(result).toEqual({ limit: 10, offset: 0 })
  })

  it('honours an explicit offset', () => {
    const result = parsePagination(new URLSearchParams('offset=20&limit=5'))
    expect(result).toEqual({ limit: 5, offset: 20 })
  })

  it('maps a 1-based page to an offset', () => {
    const result = parsePagination(new URLSearchParams('page=3&limit=25'))
    expect(result).toEqual({ limit: 25, offset: 50 })
  })

  it('rejects a limit above the maximum', () => {
    const result = parsePagination(new URLSearchParams('limit=201'))
    expect('error' in result).toBe(true)
  })

  it('rejects a negative offset', () => {
    const result = parsePagination(new URLSearchParams('offset=-1'))
    expect('error' in result).toBe(true)
  })

  it('rejects a non-numeric limit', () => {
    const result = parsePagination(new URLSearchParams('limit=abc'))
    expect('error' in result).toBe(true)
  })
})

describe('jsonWithPagination', () => {
  it('keeps the array body and adds total-count headers', () => {
    const res = jsonWithPagination([{ id: 1 }], { limit: 10, offset: 0 }, 42)
    expect(res.headers.get('X-Total-Count')).toBe('42')
    expect(res.headers.get('X-Pagination-Limit')).toBe('10')
    expect(res.headers.get('X-Pagination-Offset')).toBe('0')
  })
})
