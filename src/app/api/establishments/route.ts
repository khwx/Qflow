import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { authenticateRequest } from '@/lib/auth'
import { assertOwnership } from '@/lib/ownership'
import { jsonWithPagination, parsePagination } from '@/lib/pagination'
import { establishmentSchema, validateBody } from '@/lib/validators'

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    if ('error' in pagination) {
      return NextResponse.json({ error: pagination.error }, { status: 400 })
    }

    const { data, error, count } = await createAdminClient()
      .from('establishments')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return jsonWithPagination(data, pagination, count ?? 0)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, { keyPrefix: 'establishments' })
  if (limited.response) return limited.response
  const auth = await authenticateRequest(request)
  if ('response' in auth) return auth.response
  try {
    const result = await validateBody(request, establishmentSchema)
    if ('response' in result) return result.response
    const { name, slug: rawSlug, description, category, address, phone, primary_color } =
      result.data

    const admin = createAdminClient()
    const baseSlug = rawSlug // já normalizado pelo Zod (normalizeSlug)
    let finalSlug = baseSlug
    for (let suffix = 2; suffix <= 20; suffix++) {
      const { data: existing } = await admin
        .from('establishments')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()
      if (!existing) break
      finalSlug = `${baseSlug}-${suffix}`
    }
    // Se após 20 tentativas ainda colide, retorna 409 amigável
    {
      const { data: stillExists } = await admin
        .from('establishments')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()
      if (stillExists) {
        return NextResponse.json(
          { error: 'Já existe um estabelecimento com esse slug', suggestedSlug: `${baseSlug}-2` },
          { status: 409 }
        )
      }
    }

    const { data, error } = await admin
      .from('establishments')
      .insert({
        name,
        slug: finalSlug,
        description,
        category,
        address,
        phone,
        primary_color: primary_color || '#4f46e5',
        owner_id: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      // Trata violação unique de forma amigável (corrida concorrente)
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um estabelecimento com esse slug', suggestedSlug: `${baseSlug}-2` },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fila padrão criada pelo trigger trg_ensure_default_queue (schema.sql)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
