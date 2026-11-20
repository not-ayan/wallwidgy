import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createKeyedTaskQueue } from '@/lib/favorites-state'
import { sanitizeSetups } from '@/app/api/setups/route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const userMutationQueue = createKeyedTaskQueue()

// GET - Current authenticated user's profile data (setups, backdrop, favorites)
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    return NextResponse.json(
      {
        username: user.username,
        displayName: user.fullName || user.firstName || user.username || 'Curator',
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        backdrop: (user.publicMetadata?.backdrop as string) || null,
        setups: sanitizeSetups(user.publicMetadata?.setups),
        favorites: (user.publicMetadata?.favorites as string[]) || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching profile metadata:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST - Update current user's profile metadata (backdrop, setups)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const metadataToUpdate: Record<string, any> = {}

    if (typeof body.backdrop === 'string') {
      metadataToUpdate.backdrop = body.backdrop.trim()
    }

    if (Array.isArray(body.setups)) {
      metadataToUpdate.setups = sanitizeSetups(body.setups)
    }

    if (Object.keys(metadataToUpdate).length > 0) {
      await userMutationQueue.enqueue(userId, async () => {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: metadataToUpdate,
        })
      })
    }

    return NextResponse.json({ success: true, ...metadataToUpdate })
  } catch (error) {
    console.error('Error updating profile metadata:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
