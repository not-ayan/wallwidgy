import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

// GET - Fetch user's favorites from Clerk metadata
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ favorites: [] }, { status: 401 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const favorites = (user.publicMetadata?.favorites as string[]) || []

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST - Save favorites to Clerk metadata
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { favorites } = await request.json()
    
    if (!Array.isArray(favorites)) {
      return NextResponse.json({ error: 'Invalid favorites format' }, { status: 400 })
    }

    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        favorites: favorites
      }
    })

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Error saving favorites:', error)
    return NextResponse.json({ error: 'Failed to save favorites' }, { status: 500 })
  }
}

// PATCH - Add or remove a single favorite
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wallpaperId, action } = await request.json()
    
    if (!wallpaperId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    let favorites = (user.publicMetadata?.favorites as string[]) || []

    if (action === 'add' && !favorites.includes(wallpaperId)) {
      favorites = [...favorites, wallpaperId]
    } else if (action === 'remove') {
      favorites = favorites.filter(id => id !== wallpaperId)
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        favorites: favorites
      }
    })

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Error updating favorite:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
