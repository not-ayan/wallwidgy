import { NextRequest, NextResponse } from 'next/server'
import { fetchIndexJson } from '@/lib/wallpapers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    const count = Math.min(50, Math.max(1, parseInt(url.searchParams.get('count') || '10')))

    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ wallpapers: [] })
    }

    if (!q) {
      return NextResponse.json({ wallpapers: data.slice(0, count) })
    }

    const filtered = data.filter((item: any) => {
      const name = (item.file_name || '').toLowerCase()
      const category = (item.category || '').toLowerCase()
      const tags = Array.isArray(item.data?.tags) ? item.data.tags.join(' ').toLowerCase() : ''
      return name.includes(q) || category.includes(q) || tags.includes(q)
    })

    return NextResponse.json({ wallpapers: filtered.slice(0, count) })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
