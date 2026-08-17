import { NextResponse } from 'next/server'
import { createClientComponentClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rateLimit'
import { forgotPasswordSchema, validateBody } from '@/lib/validators'

export async function POST(request: Request) {
  const limited = rateLimit(request, { keyPrefix: 'auth', max: 5, windowMs: 60_000 })
  if (limited.response) return limited.response
  try {
    const result = await validateBody(request, forgotPasswordSchema)
    if ('response' in result) return result.response
    const { email } = result.data

    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
