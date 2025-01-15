import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('access_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single()

    if (tokenError) throw new Error('Invalid token')

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Token has expired')
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', tokenData.user_id)
      .single()

    if (userError) throw userError

    return NextResponse.json({ user: userData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

