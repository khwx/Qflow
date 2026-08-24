import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Pagination query params shared by every list endpoint. All values are
 * optional and validated; `limit` is clamped to a sane maximum to avoid
 * abusive payloads, and `page` is a 1-based convenience that maps to `offset`.
 */
const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).optional(),
})

export interface ParsedPagination {
  limit: number
  offset: number
}

export const DEFAULT_PAGE_SIZE = 50

/**
 * Parses `limit`, `offset` and `page` from a URLSearchParams.
 * Returns `{ error }` (with a 400-ready message) when the input is invalid,
 * otherwise the resolved `{ limit, offset }`.
 */
export function parsePagination(
  searchParams: URLSearchParams
): ParsedPagination | { error: string } {
  const parsed = paginationQuerySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
    page: searchParams.get('page') ?? undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'param'}: ${issue.message}`)
        .join('; '),
    }
  }

  const limit = parsed.data.limit ?? DEFAULT_PAGE_SIZE
  const offset =
    parsed.data.offset ?? (parsed.data.page ? (parsed.data.page - 1) * limit : 0)

  return { limit, offset }
}

/**
 * Builds a JSON response that keeps the original array body (non-breaking) and
 * exposes total count + window via headers so clients can paginate.
 */
export function jsonWithPagination(
  data: unknown,
  pagination: ParsedPagination,
  total: number,
  init?: ResponseInit
): NextResponse {
  const headers = new Headers(init?.headers)
  headers.set('X-Total-Count', String(total))
  headers.set('X-Pagination-Limit', String(pagination.limit))
  headers.set('X-Pagination-Offset', String(pagination.offset))
  return NextResponse.json(data, { ...init, headers })
}
