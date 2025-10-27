import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Helper: recursively collect files under a directory
async function collectFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const nestedFiles = await collectFiles(fullPath)
        files.push(...nestedFiles)
      } else if (entry.isFile()) {
        // Only include common image extensions
        if (/\.(jpe?g|png|webp|avif|gif)$/i.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }

    return files
  } catch (error) {
    return []
  }
}

// Helper: determine if a filename suggests mobile wallpaper
function isMobileName(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('mobile') || 
         lower.includes('phone') || 
         lower.includes('portrait') ||
         lower.includes('vertical')
}

// Helper: determine if a filename suggests desktop wallpaper
function isDesktopName(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('desktop') || 
         lower.includes('landscape') || 
         lower.includes('wide') ||
         lower.includes('horizontal')
}

// Helper: shuffle array using Fisher-Yates algorithm
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
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
    const indexResponse = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
    if (!indexResponse.ok) {
      throw new Error('Failed to fetch wallpapers index')
    }
    
    const indexData = await indexResponse.json()
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

    // Get filenames after type filtering
    const filenames = wallpaperItems.map((item: any) => item.file_name)

    // Shuffle and select requested count
    const shuffledFilenames = shuffle(filenames)
    const selectedFilenames = shuffledFilenames.slice(0, count)

    // Convert filenames to public URLs
    const baseUrl = url.origin
    const wallpapers = selectedFilenames.map((filename) => 
      `${baseUrl}/wallpapers/${filename as string}`
    )

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
