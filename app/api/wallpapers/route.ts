import { NextResponse } from 'next/server'
import { fetchIndexJson } from '@/lib/wallpapers'

// Helper: Pick N random items efficiently without cloning/shuffling the full array
function pickRandom<T>(array: T[], count: number): T[] {
  const n = array.length
  if (n <= count) return array.slice()
  
  const result: T[] = []
  const chosenIndices = new Set<number>()
  
  while (result.length < count && chosenIndices.size < n) {
    const idx = Math.floor(Math.random() * n)
    if (!chosenIndices.has(idx)) {
      chosenIndices.add(idx)
      result.push(array[idx])
    }
  }
  return result
}


export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    
    // Parse query parameters
    const type = url.searchParams.get('type')?.toLowerCase() // 'desktop' | 'mobile'
    const category = url.searchParams.get('category')
    const color = url.searchParams.get('color')?.toLowerCase()
    const count = Math.min(10, Math.max(1, parseInt(url.searchParams.get('count') || '1')))

    // Fetch wallpapers from index.json (same as categories page)
    const indexData = await fetchIndexJson()
    let wallpaperItems = indexData

    // Filter by category if specified
    if (category) {
      wallpaperItems = indexData.filter((item: any) => 
        item.category === `#${category}`
      )
      
      if (wallpaperItems.length === 0) {
        return NextResponse.json(
          { error: `Category '${category}' not found` }, 
          { status: 404 }
        )
      }
    }

    // Filter by color if specified
    if (color) {
      wallpaperItems = wallpaperItems.filter((item: any) => {
        try {
          if (!item || !item.data) return false
          
          const primaryColors = (item.data.primary_colors || '').toString().toLowerCase()
          const secondaryColors = (item.data.secondary_colors || '').toString().toLowerCase()
          
          // Split by spaces and check if any color matches
          const allColors = `${primaryColors} ${secondaryColors}`.split(/\s+/).filter(c => c.length > 0)
          return allColors.some(c => c.trim() === color.trim())
        } catch (error) {
          console.error('Error filtering by color:', error, item)
          return false
        }
      })
      
      if (wallpaperItems.length === 0) {
        return NextResponse.json(
          { error: `No wallpapers found with color '${color}'` }, 
          { status: 404 }
        )
      }
    }

    if (wallpaperItems.length === 0) {
      return NextResponse.json(
        { error: 'No wallpapers found' }, 
        { status: 404 }
      )
    }

    // Filter by type if specified (using orientation from index data)
    if (type === 'mobile') {
      wallpaperItems = wallpaperItems.filter((item: any) => item.orientation === 'Mobile')
    } else if (type === 'desktop') {
      wallpaperItems = wallpaperItems.filter((item: any) => item.orientation === 'Desktop')
    }

    // If no files match the type filter, keep original wallpaperItems
    if (wallpaperItems.length === 0 && type) {
      // Restore original wallpaperItems if filter didn't match anything
      if (category) {
        wallpaperItems = indexData.filter((item: any) => item.category === `#${category}`)
      } else {
        wallpaperItems = indexData
      }
    }

    // Select requested count of items randomly without heavy full-array shuffling
    const selectedItems = pickRandom(wallpaperItems, count)


    // Convert items to GitHub raw URLs
    const STORAGE_MAIN_BASE_URL =
      process.env.WALLWIDGY_MAIN_BASE_URL || "https://raw.githubusercontent.com/not-ayan/storage/main/main"

    const wallpapers = selectedItems.map((item: any) => {
      const mainName = item.file_main_name || item.file_name
      return `${STORAGE_MAIN_BASE_URL}/${mainName}`
    })

    // Prepare response
    const response = NextResponse.json({
      wallpapers,
      count: wallpapers.length,
      category: category || 'all',
      type: type || 'all',
      color: color || 'all'
    })

    // Add CORS headers for cross-origin access
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59')

    return response

  } catch (error) {
    console.error('API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      }, 
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
