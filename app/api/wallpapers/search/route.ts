import { NextRequest, NextResponse } from 'next/server'
import { fetchIndexJson } from '@/lib/wallpapers'

export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    const countParam = url.searchParams.get('count')
    const parsedCount = countParam !== null ? parseInt(countParam, 10) : 10
    if (Number.isNaN(parsedCount)) {
      return NextResponse.json(
        { error: 'Invalid count parameter' },
        { status: 400 }
      )
    }
    const count = Math.min(50, Math.max(1, parsedCount))

    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Wallpapers index temporarily unavailable', wallpapers: [] },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    if (!q) {
      return NextResponse.json({ wallpapers: data.slice(0, count) }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
      })
    }

    const matches: any[] = []
    for (const item of data) {
      if (matches.length >= count) break
      const name = (item.file_name || '').toLowerCase()
      if (name.includes(q)) {
        matches.push(item)
        continue
      }
      const category = (item.category || '').toLowerCase()
      if (category.includes(q)) {
        matches.push(item)
        continue
      }
      if (Array.isArray(item.data?.tags)) {
        let tagMatch = false
        for (const tag of item.data.tags) {
          if (typeof tag === 'string' && tag.toLowerCase().includes(q)) {
            tagMatch = true
            break
          }
        }
        if (tagMatch) {
          matches.push(item)
        }
      }
    }

    return NextResponse.json({ wallpapers: matches }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

