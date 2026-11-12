import { NextResponse } from 'next/server'
import { fetchColorsWithSingleFlight } from '@/lib/colors'

export const revalidate = 86400

export async function GET() {
  try {
    const colors = await fetchColorsWithSingleFlight()
    if (!colors || colors.length === 0) {
      return NextResponse.json(
        { error: 'Colors index is empty or unavailable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const response = NextResponse.json(colors)
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=600')
    return response
  } catch (error: any) {
    console.error('Error in /api/colors:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
