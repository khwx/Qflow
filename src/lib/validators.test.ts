import { describe, it, expect } from 'vitest'
import {
  establishmentSchema,
  establishmentPatchSchema,
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
  validateBody,
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
