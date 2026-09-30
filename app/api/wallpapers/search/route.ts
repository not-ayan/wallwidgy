import { NextRequest, NextResponse } from 'next/server'
import { fetchIndexJson } from '@/lib/wallpapers'

export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    const count = Math.min(50, Math.max(1, parseInt(url.searchParams.get('count') || '10', 10)))

    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ wallpapers: [] }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
      })
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

