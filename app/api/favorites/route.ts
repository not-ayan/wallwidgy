import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to normalize wallpaper IDs
function normalizeId(id: string): string {
  if (!id) return ''
  return decodeURIComponent(id).replace(/\.[^/.]+$/, '').toLowerCase().trim()
}

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
    const seen = new Set<string>()
    const cleanFavorites: string[] = []
    for (const item of favorites) {
      if (typeof item !== 'string' || !item.trim()) continue
      const norm = normalizeId(item)
      if (!seen.has(norm)) {
        seen.add(norm)
        cleanFavorites.push(item)
      }
    }

    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        favorites: cleanFavorites
      }
    })

    return NextResponse.json({ success: true, favorites: cleanFavorites })
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
    if (!Array.isArray(favorites)) favorites = []

    const targetNorm = normalizeId(wallpaperId)

    if (action === 'add') {
      const exists = favorites.some(id => id === wallpaperId || normalizeId(id) === targetNorm)
      if (!exists) {
        favorites = [...favorites, wallpaperId]
      }
    } else if (action === 'remove') {
      favorites = favorites.filter(id => id !== wallpaperId && normalizeId(id) !== targetNorm)
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        favorites
      }
    })

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Error updating favorite:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
