import { NextResponse } from 'next/server'
import { fetchIndexJson } from '@/lib/wallpapers'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const rawData = await fetchIndexJson()
    
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return NextResponse.json({ error: 'Wallpapers index is empty or failed to load' }, {
        status: 502,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    // Include all searchable & presentation fields (tags, colors, styles, objects,
    // textures, and scene descriptions) while stripping purely internal prompt metadata
    // (lighting, camera composition, art quality scores) to keep the gzipped payload
    // around ~400KB instead of 4.5MB uncompressed.
    const cleanData = rawData.map((item: any) => ({
      file_name: item.file_name,
      file_cache_name: item.file_cache_name,
      file_main_name: item.file_main_name,
      width: item.width,
      height: item.height,
      resolution: item.resolution,
      orientation: item.orientation,
      timestamp: item.timestamp,
      category: item.category,
      data: item.data ? {
        art_style: item.data.art_style,
        series: item.data.series,
        character_names: item.data.character_names,
        primary_colors: item.data.primary_colors,
        secondary_colors: item.data.secondary_colors,
        color_palette: item.data.color_palette,
        mood: item.data.mood,
        technique: item.data.technique,
        tags: item.data.tags,
        category: item.data.category,
        objects: item.data.objects,
        textures: item.data.textures,
        scene_description: item.data.scene_description,
      } : undefined
    }))
    
    return NextResponse.json(cleanData, {
      headers: {
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
