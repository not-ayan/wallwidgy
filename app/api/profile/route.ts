import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId, name, bio } = await request.json()

  if (!userId || !name) {
    return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, name, bio })
      .select()

    if (error) throw error

    return NextResponse.json({ profile: data[0] })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

