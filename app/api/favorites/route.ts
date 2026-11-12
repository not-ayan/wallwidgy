import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { applyFavoriteAction, createKeyedTaskQueue, deduplicateIds } from '@/lib/favorites-state'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const userMutationQueue = createKeyedTaskQueue()

// GET - Fetch user's favorites from Clerk metadata
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { favorites: [] }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      )
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const rawFavorites = (user.publicMetadata?.favorites as string[]) || []
    
    // Ensure favorites is a clean array of strings
    const favorites = Array.isArray(rawFavorites) ? rawFavorites.filter(Boolean) : []

    return NextResponse.json(
      { favorites },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
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

    const body = await request.json()
    const favorites = body.favorites
    
    if (!Array.isArray(favorites)) {
      return NextResponse.json({ error: 'Invalid favorites format' }, { status: 400 })
    }

    // Deduplicate while preserving original IDs
    const cleanFavorites = deduplicateIds(favorites)

    const updatedFavorites = await userMutationQueue.enqueue(userId, async () => {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          favorites: cleanFavorites
        }
      })
      return cleanFavorites
    })

    return NextResponse.json({ success: true, favorites: updatedFavorites })
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
    
    if (!wallpaperId || typeof wallpaperId !== 'string' || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const favorites = await userMutationQueue.enqueue(userId, async () => {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const currentRaw = (user.publicMetadata?.favorites as string[]) || []
      const current = Array.isArray(currentRaw) ? currentRaw : []
      const next = applyFavoriteAction(current, wallpaperId, action)

      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          favorites: next
        }
      })
      return next
    })

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Error updating favorite:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
