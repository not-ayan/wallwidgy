import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createKeyedTaskQueue } from '@/lib/favorites-state'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const userMutationQueue = createKeyedTaskQueue()

export interface SetupWallpaper {
  id?: string
  name?: string
  previewUrl: string
  downloadUrl?: string
}

export interface UserSetup {
  id: string
  name: string
  homescreen?: SetupWallpaper | null
  lockscreen?: SetupWallpaper | null
}

export const MAX_SETUPS = 4

export function sanitizeSetups(raw: any): UserSetup[] {
  if (!Array.isArray(raw)) return []

  return raw.slice(0, MAX_SETUPS).map((item, index) => {
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `setup-${Date.now()}-${index}`
    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Setup ${index + 1}`

    const homescreen =
      item.homescreen && typeof item.homescreen.previewUrl === 'string' && item.homescreen.previewUrl.trim()
        ? {
            id: item.homescreen.id || item.homescreen.name || 'home',
            name: item.homescreen.name || 'Home Wallpaper',
            previewUrl: item.homescreen.previewUrl.trim(),
            downloadUrl: item.homescreen.downloadUrl || undefined,
          }
        : null

    const lockscreen =
      item.lockscreen && typeof item.lockscreen.previewUrl === 'string' && item.lockscreen.previewUrl.trim()
        ? {
            id: item.lockscreen.id || item.lockscreen.name || 'lock',
            name: item.lockscreen.name || 'Lockscreen Wallpaper',
            previewUrl: item.lockscreen.previewUrl.trim(),
            downloadUrl: item.lockscreen.downloadUrl || undefined,
          }
        : null

    return {
      id,
      name,
      homescreen,
      lockscreen,
    }
  })
}

// GET - Fetch user's setups from Clerk metadata
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { setups: [] },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      )
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const rawSetups = user.publicMetadata?.setups
    const setups = sanitizeSetups(rawSetups)

    return NextResponse.json(
      { setups },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching user setups:', error)
    return NextResponse.json({ error: 'Failed to fetch setups' }, { status: 500 })
  }
}

// POST - Save user's setups (enforcing max 4) to Clerk metadata
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rawSetups = body.setups

    if (!Array.isArray(rawSetups)) {
      return NextResponse.json({ error: 'Invalid setups format' }, { status: 400 })
    }

    if (rawSetups.length > MAX_SETUPS) {
      return NextResponse.json({ error: `Maximum limit of ${MAX_SETUPS} setups exceeded` }, { status: 400 })
    }

    const cleanSetups = sanitizeSetups(rawSetups)

    const updatedSetups = await userMutationQueue.enqueue(userId, async () => {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          setups: cleanSetups,
        },
      })
      return cleanSetups
    })

    return NextResponse.json({ success: true, setups: updatedSetups })
  } catch (error) {
    console.error('Error saving user setups:', error)
    return NextResponse.json({ error: 'Failed to save setups' }, { status: 500 })
  }
}
