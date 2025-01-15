import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    // Generate a unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Store the user and token in Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ name })
      .select()
      .single()

    if (userError) throw userError

    const { error: tokenError } = await supabase
      .from('access_tokens')
      .insert({
        user_id: userData.id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) throw tokenError

    return NextResponse.json({ token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

