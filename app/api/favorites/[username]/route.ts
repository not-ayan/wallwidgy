import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

// GET - Fetch a user's favorites by username (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const client = await clerkClient()
    
    // Search for user by username
    const users = await client.users.getUserList({
      username: [username],
      limit: 1
    })

    if (users.data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users.data[0]
    const favorites = (user.publicMetadata?.favorites as string[]) || []

    return NextResponse.json({
      username: user.username,
      displayName: user.firstName || user.username,
      imageUrl: user.imageUrl,
      favorites,
      favoritesCount: favorites.length
    })
  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}
