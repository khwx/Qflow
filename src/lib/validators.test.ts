import { describe, it, expect } from 'vitest'
import {
  establishmentSchema,
  establishmentPatchSchema,
  slugSchema,
  normalizeSlug,
  queueSchema,
  queuePatchSchema,
  ticketSchema,
  ticketPatchSchema,
  orderSchema,
  orderPatchSchema,
  pollSchema,
  pollPatchSchema,
  gameSchema,
  gamePatchSchema,
  forgotPasswordSchema,
  customerPatchSchema,
  validateBody,
  sanitizeInput,
} from './validators'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('establishmentSchema', () => {
  it('accepts a valid establishment', () => {
    const data = {
      name: 'Padaria',
      slug: 'padaria',
      category: 'food',
      primary_color: '#aabbcc',
    }
    expect(establishmentSchema.parse(data)).toMatchObject(data)
  })

  it('rejects missing required fields', () => {
    const result = establishmentSchema.safeParse({ name: 'x' })
    expect(result.success).toBe(false)
  })

  it('strips unknown keys', () => {
    const parsed = establishmentSchema.parse({
      name: 'Padaria',
      slug: 'padaria',
      category: 'food',
      evil: 'injected',
    })
    expect(parsed).not.toHaveProperty('evil')
  })

  it('rejects invalid color hex', () => {
    const result = establishmentSchema.safeParse({
      name: 'P',
      slug: 's',
      category: 'c',
      primary_color: 'red',
    })
    expect(result.success).toBe(false)
  })

  it('normalizes and validates the slug via the schema', () => {
    const parsed = establishmentSchema.parse({
      name: 'Café São Paulo!',
      slug: 'Café São Paulo!',
      category: 'food',
    })
    expect(parsed.slug).toBe('cafe-sao-paulo')
  })
})

describe('normalizeSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(normalizeSlug('Padaria Central')).toBe('padaria-central')
  })

  it('strips diacritics', () => {
    expect(normalizeSlug('Café São Paulo')).toBe('cafe-sao-paulo')
  })

  it('collapses non-alphanumeric runs and trims hyphens', () => {
    expect(normalizeSlug('  Foo __ Bar!!  ')).toBe('foo-bar')
  })
})

describe('slugSchema', () => {
  it('rejects a slug that normalizes to empty', () => {
    expect(slugSchema.safeParse('!!!').success).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(slugSchema.safeParse(123).success).toBe(false)
  })

  it('accepts and normalizes a valid slug', () => {
    const result = slugSchema.safeParse('My-Cool_Store!!')
    expect(result.success && result.data).toBe('my-cool-store')
  })
})

describe('queueSchema', () => {
  it('accepts valid queue with optional wait', () => {
    const data = { name: 'Q', establishment_id: 'e1', estimated_wait_minutes: 10 }
    expect(queueSchema.parse(data)).toEqual(data)
  })

  it('rejects wait over max', () => {
    const result = queueSchema.safeParse({
      name: 'Q',
      establishment_id: 'e1',
      estimated_wait_minutes: 9999,
    })
    expect(result.success).toBe(false)
  })
})

describe('ticketSchema', () => {
  it('accepts a valid ticket', () => {
    const data = {
      queue_id: 'q1',
      establishment_id: 'e1',
      ticket_number: 'A12',
      priority: 'urgent',
    }
    expect(ticketSchema.parse(data)).toEqual(data)
  })

  it('rejects invalid priority enum', () => {
    const result = ticketSchema.safeParse({
      queue_id: 'q1',
      establishment_id: 'e1',
      ticket_number: 'A12',
      priority: 'vip' as string,
    })
    expect(result.success).toBe(false)
  })

  it('accepts and persists all ticket fields (status, email, notes)', () => {
    const data = {
      queue_id: 'q1',
      establishment_id: 'e1',
      ticket_number: 'A12',
      status: 'waiting',
      priority: 'elderly',
      customer_name: 'Ana',
      customer_phone: '11999999999',
      customer_email: 'ana@example.com',
      notes: 'Needs assistance',
    }
    expect(ticketSchema.parse(data)).toEqual(data)
  })

  it('rejects invalid customer_email', () => {
    const result = ticketSchema.safeParse({
      queue_id: 'q1',
      establishment_id: 'e1',
      ticket_number: 'A12',
      customer_email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 500 chars', () => {
    const result = ticketSchema.safeParse({
      queue_id: 'q1',
      establishment_id: 'e1',
      ticket_number: 'A12',
      notes: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('orderSchema', () => {
  it('requires at least one item', () => {
    const result = orderSchema.safeParse({
      establishment_id: 'e1',
      items: [],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('validates nested item fields', () => {
    const data = {
      establishment_id: 'e1',
      items: [
        { id: 'i1', name: 'Café', quantity: 2, price: 5.5 },
      ],
      total: 11,
    }
    expect(orderSchema.parse(data)).toEqual(data)
  })

  it('rejects item quantity below 1', () => {
    const result = orderSchema.safeParse({
      establishment_id: 'e1',
      items: [{ id: 'i1', name: 'C', quantity: 0, price: 1 }],
      total: 1,
    })
    expect(result.success).toBe(false)
  })
})

describe('pollSchema', () => {
  it('requires at least two options', () => {
    const result = pollSchema.safeParse({
      question: 'Q?',
      options: ['a'],
      establishment_id: 'e1',
    })
    expect(result.success).toBe(false)
  })

  it('accepts iso datetime for expires_at', () => {
    const data = {
      question: 'Q?',
      options: ['a', 'b'],
      establishment_id: 'e1',
      expires_at: '2030-01-01T00:00:00.000Z',
    }
    expect(pollSchema.parse(data)).toEqual(data)
  })
})

describe('gameSchema', () => {
  it('accepts known types and record config', () => {
    const data = {
      name: 'Quiz',
      type: 'quiz',
      establishment_id: 'e1',
      config: { foo: 1, bar: 'x' },
    }
    expect(gameSchema.parse(data)).toEqual(data)
  })

  it('rejects unknown game type', () => {
    const result = gameSchema.safeParse({
      name: 'X',
      type: 'puzzle' as string,
      establishment_id: 'e1',
    })
    expect(result.success).toBe(false)
  })
})

describe('ticketPatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = ticketPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts a valid status update', () => {
    expect(ticketPatchSchema.parse({ status: 'called' })).toEqual({
      status: 'called',
    })
  })
})

describe('validateBody', () => {
  it('returns parsed data on success', async () => {
    const req = makeRequest({ name: 'Padaria', slug: 'p', category: 'c' })
    const result = await validateBody(req, establishmentSchema)
    expect('data' in result).toBe(true)
  })

  it('returns 400 response on invalid body', async () => {
    const req = makeRequest({ invalid: true })
    const result = await validateBody(req, establishmentSchema)
    expect('response' in result).toBe(true)
    if ('response' in result) {
      expect(result.response.status).toBe(400)
    }
  })

  it('returns 400 on malformed JSON', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: '{not json',
    })
    const result = await validateBody(req, establishmentSchema)
    expect('response' in result).toBe(true)
  })
})

describe('establishmentPatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = establishmentPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts partial updates', () => {
    const data = { name: 'Novo Nome', is_active: false }
    expect(establishmentPatchSchema.parse(data)).toEqual(data)
  })

  it('rejects invalid color', () => {
    const result = establishmentPatchSchema.safeParse({ primary_color: 'red' })
    expect(result.success).toBe(false)
  })
})

describe('queuePatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = queuePatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts partial updates', () => {
    const data = { estimated_wait_minutes: 15, is_active: true }
    expect(queuePatchSchema.parse(data)).toEqual(data)
  })

  it('rejects wait over max', () => {
    const result = queuePatchSchema.safeParse({ estimated_wait_minutes: 9999 })
    expect(result.success).toBe(false)
  })
})

describe('orderPatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = orderPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts valid status update', () => {
    expect(orderPatchSchema.parse({ status: 'ready' })).toEqual({ status: 'ready' })
  })

  it('rejects invalid status', () => {
    const result = orderPatchSchema.safeParse({ status: 'invalid' as string })
    expect(result.success).toBe(false)
  })
})

describe('pollPatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = pollPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts partial updates', () => {
    const data = { question: 'Nova pergunta?', is_active: false }
    expect(pollPatchSchema.parse(data)).toEqual(data)
  })

  it('rejects options with less than 2 items', () => {
    const result = pollPatchSchema.safeParse({ options: ['a'] })
    expect(result.success).toBe(false)
  })
})

describe('gamePatchSchema', () => {
  it('rejects empty patch body', () => {
    const result = gamePatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts partial updates', () => {
    const data = { points_reward: 20, is_active: true }
    expect(gamePatchSchema.parse(data)).toEqual(data)
  })

  it('rejects unknown game type', () => {
    const result = gamePatchSchema.safeParse({ type: 'puzzle' as string })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.parse({ email: 'test@example.com' })).toEqual({ email: 'test@example.com' })
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = forgotPasswordSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('customerPatchSchema', () => {
  it('accepts a partial update of points and visits', () => {
    const result = customerPatchSchema.safeParse({ total_points: 50, total_visits: 3 })
    expect(result.success).toBe(true)
  })

  it('accepts nullable contact fields', () => {
    const result = customerPatchSchema.safeParse({ name: null, email: null, phone: null })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = customerPatchSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects negative points', () => {
    const result = customerPatchSchema.safeParse({ total_points: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = customerPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('sanitizeInput', () => {
  it('trims leading/trailing whitespace from strings', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('strips control characters and null bytes from strings', () => {
    expect(sanitizeInput('a\x00b\x01c')).toBe('abc')
    expect(sanitizeInput('x\u200by')).toBe('xy')
  })

  it('recurses into nested objects and arrays', () => {
    const input = { name: '  Joao ', items: ['  x ', 'y'] }
    expect(sanitizeInput(input)).toEqual({ name: 'Joao', items: ['x', 'y'] })
  })

  it('passes through non-string values', () => {
    expect(sanitizeInput(42)).toBe(42)
    expect(sanitizeInput(true)).toBe(true)
    expect(sanitizeInput(null)).toBe(null)
  })

  it('is applied by validateBody before parsing', async () => {
    const req = makeRequest({ email: '  test@example.com  ' })
    const result = await validateBody(req, forgotPasswordSchema)
    expect(result).toMatchObject({ data: { email: 'test@example.com' } })
  })

  it('strips padding so over-length content is caught by validation', async () => {
    const long = 'a'.repeat(130) + ' '
    const result = await validateBody(makeRequest({ name: long, slug: 's', category: 'c' }), establishmentSchema)
    expect('response' in result).toBe(true)
  })

  it('handles empty strings', () => {
    expect(sanitizeInput('')).toBe('')
    expect(sanitizeInput('   ')).toBe('')
  })

  it('strips strings that are only control characters', () => {
    expect(sanitizeInput('\x00\x01\x02')).toBe('')
    expect(sanitizeInput('\u200b\u200c')).toBe('')
  })

  it('handles deeply nested objects', () => {
    const deep = { a: { b: { c: { d: '  deep  ' } } } }
    expect(sanitizeInput(deep)).toEqual({ a: { b: { c: { d: 'deep' } } } })
  })

  it('handles arrays with mixed types', () => {
    const mixed = ['  a  ', 123, true, null, { b: '  c  ' }]
    expect(sanitizeInput(mixed)).toEqual(['a', 123, true, null, { b: 'c' }])
  })

  it('defends against prototype pollution attempts', () => {
    const input = { __proto__: { polluted: true }, constructor: { prototype: { polluted: true } } }
    const result = sanitizeInput(input) as Record<string, unknown>
    expect(result.__proto__).toBeUndefined()
    expect(result.constructor).toBeUndefined()
  })

  it('handles unicode whitespace and zero-width characters', () => {
    expect(sanitizeInput('\u00A0hello\u00A0')).toBe('hello')
    expect(sanitizeInput('\u200B\u200C\u200D\uFEFF')).toBe('')
    expect(sanitizeInput('a\u2060b')).toBe('ab')
  })

  it('passes through Date objects', () => {
    const date = new Date('2026-01-01T00:00:00.000Z')
    expect(sanitizeInput(date)).toBe(date)
  })

  it('handles circular references without throwing', () => {
    const obj: Record<string, unknown> = { a: '  test  ' }
    obj.self = obj
    const result = sanitizeInput(obj) as Record<string, unknown>
    expect(result.a).toBe('test')
    expect(result.self).toBe(result)
  })
})
