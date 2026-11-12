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

let tableInitialized = false

async function ensureTable(db: any): Promise<void> {
  if (tableInitialized || !db) return
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS wallpaper_downloads (
          sha TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          platform TEXT,
          category TEXT,
          download_count INTEGER DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run()
    tableInitialized = true
  } catch (err) {
    console.warn('Could not ensure wallpaper_downloads table:', err)
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

    const upsertSql = `
      INSERT INTO wallpaper_downloads (sha, name, platform, category, download_count, updated_at)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(sha) DO UPDATE SET
        download_count = download_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `

    try {
      await db.prepare(upsertSql).bind(wallpaperSha, wallpaperName, platform, category).run()
    } catch (insertErr: any) {
      if (String(insertErr?.message || '').includes('no such table')) {
        await ensureTable(db)
        try {
          await db.prepare(upsertSql).bind(wallpaperSha, wallpaperName, platform, category).run()
        } catch (retryErr) {
          console.warn('Retry after ensureTable failed:', retryErr)
        }
      } else {
        console.warn('Error inserting download into D1:', insertErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking download in D1:', error)
    return NextResponse.json({ success: false, error: 'Failed to record download' }, { status: 500 })
  }
}

/**
 * GET /api/downloads
 * Returns the most downloaded wallpapers (for "Trending" / "Popular" features)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10)
    if (searchParams.has('limit') && Number.isNaN(rawLimit)) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 })
    }
    const limit = Math.min(100, Math.max(1, rawLimit))

    const db = await getD1Database()

    if (!db) {
      return NextResponse.json({
        success: true,
        wallpapers: [],
        message: 'D1 database binding not active (local dev mode)',
      })
    }

    const selectSql = `
      SELECT sha, name, platform, category, download_count, updated_at
      FROM wallpaper_downloads
      ORDER BY download_count DESC
      LIMIT ?
    `

    try {
      const { results } = await db.prepare(selectSql).bind(limit).all()
      return NextResponse.json({
        success: true,
        wallpapers: results || [],
      })
    } catch (queryErr: any) {
      const msg = String(queryErr?.message || '')
      if (msg.includes('no such table')) {
        await ensureTable(db)
        return NextResponse.json({
          success: true,
          wallpapers: [],
          message: 'Table initialized',
        })
      }
      console.warn('Error querying downloads from D1:', queryErr)
      return NextResponse.json({
        success: true,
        wallpapers: [],
      })
    }
  } catch (error) {
    console.error('Error querying downloads from D1:', error)
    return NextResponse.json({ success: true, wallpapers: [] })
  }
}
