import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

async function getD1Database() {
  try {
    const context = await getCloudflareContext({ async: true })
    return (context.env as any)?.DB || null
  } catch {
    return null
  }
}

/**
 * POST /api/downloads
 * Records a wallpaper download event in Cloudflare D1
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sha, name, platform = 'unknown', category = 'unknown' } = body

    if (!sha && !name) {
      return NextResponse.json({ error: 'Missing wallpaper identifier' }, { status: 400 })
    }

    const wallpaperSha = sha || name
    const wallpaperName = name || sha

    const db = await getD1Database()

    if (!db) {
      // Running locally in standard next dev without Cloudflare binding
      console.log(`[D1 Local Dev] Download tracked for: ${wallpaperName} (${wallpaperSha})`)
      return NextResponse.json({ success: true, simulated: true })
    }

    // Upsert into wallpaper_downloads table
    await db
      .prepare(
        `INSERT INTO wallpaper_downloads (sha, name, platform, category, download_count, updated_at)
         VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(sha) DO UPDATE SET
           download_count = download_count + 1,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(wallpaperSha, wallpaperName, platform, category)
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking download in D1:', error)
    return NextResponse.json({ error: 'Failed to record download' }, { status: 500 })
  }
}

/**
 * GET /api/downloads
 * Returns the most downloaded wallpapers (for future "Trending" / "Popular" features)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

    const db = await getD1Database()

    if (!db) {
      return NextResponse.json({
        success: true,
        wallpapers: [],
        message: 'D1 database binding not active (local dev mode)',
      })
    }

    const { results } = await db
      .prepare(
        `SELECT sha, name, platform, category, download_count, updated_at
         FROM wallpaper_downloads
         ORDER BY download_count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all()

    return NextResponse.json({
      success: true,
      wallpapers: results || [],
    })
  } catch (error) {
    console.error('Error querying downloads from D1:', error)
    return NextResponse.json({ error: 'Failed to query download statistics' }, { status: 500 })
  }
}
