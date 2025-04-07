import { NextResponse } from 'next/server'

/**
 * Wallpaper API Documentation
 * 
 * This API provides access to wallpaper data stored in a GitHub repository.
 * The data is fetched from an index.json file that contains metadata about each wallpaper.
 * 
 * Endpoints:
 * 
 * GET /api/wallpapers
 * - Fetches all wallpapers from the GitHub index
 * - Returns an array of wallpaper objects sorted by upload date (newest first)
 * - Each wallpaper object includes:
 *   - sha: Unique identifier (filename)
 *   - name: Original filename
 *   - width: Image width in pixels
 *   - height: Image height in pixels
 *   - preview_url: URL to the WebP preview image
 *   - download_url: URL to the full resolution image
 *   - resolution: Resolution label (1080p, 1440p, 4K, etc.)
 *   - tag: Device orientation (Desktop/Mobile)
 *   - platform: Device orientation (Desktop/Mobile)
 *   - uploadDate: Date when the wallpaper was added
 *   - format: Image file format
 * 
 * POST /api/wallpapers
 * - Not available (405 Method Not Allowed)
 * - Wallpapers are managed through GitHub repository
 * 
 * DELETE /api/wallpapers?sha={filename}
 * - Not available (405 Method Not Allowed)
 * - Wallpapers are managed through GitHub repository
 * 
 * Data Source:
 * - Main repository: https://github.com/not-ayan/storage
 * - Index file: https://raw.githubusercontent.com/not-ayan/storage/main/index.json
 * - Images are served from:
 *   - Preview: https://raw.githubusercontent.com/not-ayan/storage/main/cache/
 *   - Full resolution: https://raw.githubusercontent.com/not-ayan/storage/main/main/
 */

interface WallpaperFile {
  file_name: string;
  file_cache_name: string;
  file_main_name: string;
  width: number;
  height: number;
  resolution: string;
  orientation: "Desktop" | "Mobile";
  timestamp: string;
}

// Cache the wallpapers data for 1 hour
let cachedWallpapers: any[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

export async function GET() {
  try {
    // Return cached data if it's still valid
    const now = Date.now()
    if (cachedWallpapers && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json(cachedWallpapers)
    }

    // Fetch the index.json file from GitHub
    const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch index.json: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format: expected an array')
    }

    // Transform the data to match the expected format
    const wallpapers = data.map((item: WallpaperFile) => {
      // Skip invalid items without logging to improve performance
      if (!item.file_name || !item.file_cache_name || !item.file_main_name) {
        return null
      }

      return {
        sha: item.file_name,
        name: item.file_name,
        width: item.width,
        height: item.height,
        preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${item.file_cache_name}`,
        download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${item.file_main_name}`,
        resolution: item.resolution,
        tag: item.orientation,
        platform: item.orientation,
        uploadDate: new Date(item.timestamp),
        format: item.file_name.split('.').pop() || 'unknown'
      }
    }).filter(Boolean) // Remove any null items from invalid data

    if (wallpapers.length === 0) {
      throw new Error('No valid wallpapers found in the index')
    }

    // Sort wallpapers by newest first
    wallpapers.sort((a: any, b: any) => b.uploadDate.getTime() - a.uploadDate.getTime())

    // Cache the results
    cachedWallpapers = wallpapers
    lastFetchTime = now

    return NextResponse.json(wallpapers)
  } catch (error: any) {
    // If we have cached data and there's an error, return the cached data
    if (cachedWallpapers) {
      console.warn('Error fetching fresh data, returning cached data:', error.message)
      return NextResponse.json(cachedWallpapers)
    }

    console.error('Error in GET /api/wallpapers:', error)
    return NextResponse.json(
      { 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Upload functionality is not available' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Delete functionality is not available' },
    { status: 405 }
  )
}

function getResolutionLabel(width: number, height: number): string {
  const resolutionPixels = width * height
  if (resolutionPixels >= 1920 * 1080 && resolutionPixels < 2560 * 1440) {
    return "1080p"
  } else if (resolutionPixels >= 2560 * 1440 && resolutionPixels < 3840 * 2160) {
    return "1440p"
  } else if (resolutionPixels >= 3840 * 2160 && resolutionPixels < 7680 * 4320) {
    return "4K"
  } else if (resolutionPixels >= 7680 * 4320 && resolutionPixels < 15360 * 8640) {
    return "8K"
  } else if (resolutionPixels >= 15360 * 8640) {
    return "16K"
  } else {
    return "Below 1080p"
  }
}

