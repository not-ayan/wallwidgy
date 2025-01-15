import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Generate a random token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Store the token in Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({ email })
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

    // Send email with token
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your Login Token for Minimalist Wallpapers',
      html: `
        <h1>Your Login Token</h1>
        <p>Here's your token to access Minimalist Wallpapers:</p>
        <p style="font-size: 24px; font-weight: bold; padding: 12px; background: #f5f5f5; border-radius: 6px;">${token}</p>
        <p>This token will expire in 24 hours.</p>
      `,
    })

    return NextResponse.json({ message: 'Token sent to your email!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

