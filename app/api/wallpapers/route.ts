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
    const count = Math.min(10, Math.max(1, parseInt(url.searchParams.get('count') || '1')))

    // Base wallpapers directory
    const wallpapersRoot = path.join(process.cwd(), 'public', 'wallpapers')

    // Determine target directory
    let targetDir = wallpapersRoot
    if (category) {
      const categoryDir = path.join(wallpapersRoot, category)
      try {
        const stat = await fs.stat(categoryDir)
        if (stat.isDirectory()) {
          targetDir = categoryDir
        } else {
          return NextResponse.json(
            { error: `Category '${category}' not found` }, 
            { status: 404 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: `Category '${category}' not found` }, 
          { status: 404 }
        )
      }
    }

    // Collect all image files
    const allFiles = await collectFiles(targetDir)

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: 'No wallpapers found' }, 
        { status: 404 }
      )
    }

    // Filter by type if specified
    let filteredFiles = allFiles
    if (type === 'mobile') {
      filteredFiles = allFiles.filter(file => isMobileName(path.basename(file)))
    } else if (type === 'desktop') {
      filteredFiles = allFiles.filter(file => isDesktopName(path.basename(file)))
    }

    // If no files match the type filter, fall back to all files
    if (filteredFiles.length === 0 && type) {
      filteredFiles = allFiles
    }

    // Shuffle and select requested count
    const shuffledFiles = shuffle(filteredFiles)
    const selectedFiles = shuffledFiles.slice(0, count)

    // Convert file paths to public URLs
    const baseUrl = url.origin
    const wallpapers = selectedFiles.map(filePath => {
      const relativePath = path.relative(wallpapersRoot, filePath)
      const urlPath = relativePath.split(path.sep).join('/')
      return `${baseUrl}/wallpapers/${urlPath}`
    })

    // Prepare response
    const response = NextResponse.json({
      wallpapers,
      count: wallpapers.length,
      category: category || 'all',
      type: type || 'all'
    })

    // Add CORS headers for cross-origin access
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
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
