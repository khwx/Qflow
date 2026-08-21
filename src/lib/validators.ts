import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Normalizes a raw slug into a URL-safe identifier: lowercases, strips
 * diacritics (accents), replaces any run of non-alphanumeric characters with a
 * single hyphen and trims leading/trailing hyphens. This keeps stored slugs
 * consistent with how they are looked up in routing (e.g. `/qr/[slug]`,
 * `?est=slug`, `tv-display`/`queue` which do `slug.toLowerCase()`).
 */
export function normalizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const slugSchema = z
  .string()
  .transform(normalizeSlug)
  .pipe(
    z
      .string()
      .min(1, 'Slug is required')
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  )

export const establishmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: slugSchema,
  description: z.string().max(500).nullable().optional(),
  category: z.string().min(1, 'Category is required').max(60),
  address: z.string().max(255).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color')
    .optional(),
})

export const establishmentPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    slug: slugSchema.optional(),
    description: z.string().max(500).nullable().optional(),
    category: z.string().min(1).max(60).optional(),
    address: z.string().max(255).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No valid fields to update')

export const queueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).nullable().optional(),
  establishment_id: z.string().min(1, 'Establishment is required'),
  estimated_wait_minutes: z.number().int().min(0).max(600).optional(),
})

export const queuePatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    estimated_wait_minutes: z.number().int().min(0).max(600).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No valid fields to update')

export const ticketSchema = z.object({
  queue_id: z.string().min(1, 'Queue is required'),
  establishment_id: z.string().min(1, 'Establishment is required'),
  ticket_number: z.string().min(1, 'Ticket number is required').max(20),
  status: z
    .enum(['waiting', 'called', 'serving', 'completed', 'cancelled'])
    .optional(),
  priority: z.enum(['normal', 'urgent', 'elderly', 'pregnant']).optional(),
  customer_name: z.string().max(120).nullable().optional(),
  customer_phone: z.string().max(20).nullable().optional(),
  customer_email: z.string().email('Invalid email').max(120).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const orderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(999),
  price: z.number().min(0).max(999999),
  notes: z.string().max(255).optional(),
})

export const orderSchema = z.object({
  ticket_id: z.string().min(1).nullable().optional(),
  establishment_id: z.string().min(1, 'Establishment is required'),
  customer_id: z.string().min(1).nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  total: z.number().min(0).max(9999999),
  notes: z.string().max(500).nullable().optional(),
})

export const orderPatchSchema = z
  .object({
    status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No valid fields to update')

export const pollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(300),
  options: z.array(z.string().min(1).max(120)).min(2, 'At least two options').max(10),
  establishment_id: z.string().min(1, 'Establishment is required'),
  expires_at: z.string().datetime().nullable().optional(),
})

export const pollPatchSchema = z
  .object({
    question: z.string().min(1).max(300).optional(),
    options: z.array(z.string().min(1).max(120)).min(2).max(10).optional(),
    expires_at: z.string().datetime().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No valid fields to update')

export const gameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['quiz', 'memory', 'scratch', 'spin', 'word']),
  establishment_id: z.string().min(1, 'Establishment is required'),
  points_reward: z.number().int().min(0).max(100000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const gamePatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    type: z.enum(['quiz', 'memory', 'scratch', 'spin', 'word']).optional(),
    points_reward: z.number().int().min(0).max(100000).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No valid fields to update')

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const ticketPatchSchema = z
  .object({
    status: z
      .enum(['waiting', 'called', 'serving', 'completed', 'cancelled'])
      .optional(),
    priority: z.enum(['normal', 'urgent', 'elderly', 'pregnant']).optional(),
    customer_name: z.string().max(120).nullable().optional(),
    customer_phone: z.string().max(20).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    called_at: z.string().datetime().nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'No valid fields to update'
  )

/**
 * Recursively trims leading/trailing whitespace from strings and strips
 * control characters (incl. null bytes and zero-width chars) that could be
 * used for injection or to bypass length/format validation.
 *
 * Numbers, booleans, nulls, arrays and plain objects are passed through;
 * only string leaves are mutated.
 */
export function sanitizeInput(
  value: unknown,
  visited: Map<object, unknown> = new Map()
): unknown {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(
        /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]/gu,
        ''
      )
  }
  if (Array.isArray(value)) {
    if (visited.has(value)) return visited.get(value)
    const arr: unknown[] = []
    visited.set(value, arr)
    for (const item of value) arr.push(sanitizeInput(item, visited))
    return arr
  }
  if (value && typeof value === 'object') {
    // Non-plain objects (Date, RegExp, etc.) are passed through untouched.
    // Use toString tag rather than prototype check so a `__proto__`-literal
    // (which mutates the prototype) is still recognised as a plain object.
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      return value
    }
    // Guard against circular references (return the already-built result).
    if (visited.has(value)) return visited.get(value)
    const out = Object.create(null) as Record<string, unknown>
    visited.set(value, out)
    for (const [key, val] of Object.entries(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue
      }
      out[key] = sanitizeInput(val, visited)
    }
    return out
  }
  return value
}

export type ValidationResult<T extends z.ZodTypeAny> =
  | { data: z.infer<T> }
  | { response: NextResponse }

export async function validateBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ValidationResult<T>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(sanitizeInput(json))
  if (!result.success) {
    return {
      response: NextResponse.json(
        {
          error: 'Validation failed',
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    }
  }

  return { data: result.data }
}
