import { NextResponse } from 'next/server'
import { fetchCleanIndexString } from '@/lib/wallpapers'

export const revalidate = 3600

export async function GET() {
  try {
    const cleanJsonString = await fetchCleanIndexString()
    
    if (!cleanJsonString || cleanJsonString === '[]') {
      return NextResponse.json({ error: 'Wallpapers index is empty or failed to load' }, {
        status: 502,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    return new Response(cleanJsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error fetching wallpapers index:', error)
    return NextResponse.json({ error: 'Failed to load wallpapers index' }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }
}

