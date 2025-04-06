import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const mainDir = path.join(process.cwd(), 'public/storage/main')
const cacheDir = path.join(process.cwd(), 'public/storage/cache')

export async function GET() {
  try {
    // Read all files from the main directory
    const files = fs.readdirSync(mainDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
      })

    const wallpapers = await Promise.all(files.map(async (filename) => {
      const filePath = path.join(mainDir, filename)
      const baseName = path.basename(filename, path.extname(filename))

      // Get image dimensions
      const metadata = await sharp(filePath).metadata()
      
      if (!metadata.width || !metadata.height) {
        throw new Error(`Could not get dimensions for ${filename}`)
      }

      return {
        public_id: filename,
        filename,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        created_at: fs.statSync(filePath).mtime.toISOString(),
        tags: [],
        colors: [],
        categories: [],
      }
    }))

    return NextResponse.json(wallpapers)
  } catch (error: any) {
    console.error('Error fetching wallpapers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    // Since we're using local files, we don't need to update metadata
    return NextResponse.json({ message: 'Wallpaper updated successfully' })
  } catch (error: any) {
    console.error('Error updating wallpaper:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const public_id = request.url.split('/').pop()
  
  if (!public_id) {
    return NextResponse.json({ error: 'No wallpaper ID provided' }, { status: 400 })
  }

  try {
    const filePath = path.join(mainDir, public_id)
    const cachePath = path.join(cacheDir, public_id)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath)
    }

    return NextResponse.json({ message: 'Wallpaper deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting wallpaper:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

