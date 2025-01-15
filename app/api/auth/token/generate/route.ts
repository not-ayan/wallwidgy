import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Generate a unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Create or get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({ username })
      .select()
      .single()

    if (userError) throw userError

    // Store token
    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        user_id: userData.id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) throw tokenError

    return NextResponse.json({ token })
  } catch (error: any) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    )
  }
}

