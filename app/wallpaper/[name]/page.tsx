import { Metadata } from 'next'
import WallpaperClient from './WallpaperClient'
import { fetchIndexJson } from '@/lib/wallpapers'

export const revalidate = 3600 // Cache ISR for 1 hour

interface Props {
  params: Promise<{ name: string }>
}

interface Wallpaper {
  sha: string
  name: string
  width: number
  height: number
  preview_url: string
  download_url: string
  resolution: string
  tag: string
  platform: "Desktop" | "Mobile"
  uploadDate: string
  format: string
}

async function getWallpaper(name: string): Promise<Wallpaper | null> {
  const decodedName = decodeURIComponent(name)
  try {
    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data)) return null

    const wallpaper = data.find((item: any) => {
      if (item.file_name === decodedName) return true
      const nameWithoutExt = item.file_name.replace(/\.[^/.]+$/, "")
      return nameWithoutExt === decodedName
    })

    if (!wallpaper) return null

    return {
      sha: wallpaper.file_name,
      name: wallpaper.file_name,
      width: wallpaper.width,
      height: wallpaper.height,
      preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${wallpaper.file_cache_name}`,
      download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${wallpaper.file_main_name}`,
      resolution: wallpaper.resolution,
      tag: wallpaper.orientation,
      platform: wallpaper.orientation,
      uploadDate: wallpaper.timestamp,
      format: wallpaper.file_name.split('.').pop() || 'unknown'
    }
  } catch (error) {
    console.error("Error fetching wallpaper:", error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const wallpaper = await getWallpaper(name)
  if (!wallpaper) {
    return {
      title: 'Wallpaper Not Found | WallWidgy',
      description: 'The requested wallpaper could not be found.'
    }
  }

  const cleanName = wallpaper.name.replace(/\.[^/.]+$/, "")
  return {
    title: `${cleanName} Wallpaper | WallWidgy`,
    description: `Download ${cleanName} wallpaper. Resolution: ${wallpaper.resolution}. Platforms supported: ${wallpaper.platform}.`,
    openGraph: {
      title: `${cleanName} Wallpaper | WallWidgy`,
      description: `Download ${cleanName} wallpaper. Resolution: ${wallpaper.resolution}.`,
      images: [
        {
          url: wallpaper.preview_url,
          width: wallpaper.width,
          height: wallpaper.height,
          alt: cleanName,
        }
      ]
    }
  }
}

export async function generateStaticParams() {
  try {
    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data)) return []
    
    // Generate paths for both raw filename and filename without extension to support both types of routing
    const paths: { name: string }[] = []
    data.forEach((item: any) => {
      paths.push({ name: item.file_name })
      const nameWithoutExt = item.file_name.replace(/\.[^/.]+$/, "")
      if (nameWithoutExt !== item.file_name) {
        paths.push({ name: nameWithoutExt })
      }
    })
    return paths
  } catch (error) {
    console.error("Error in generateStaticParams for wallpaper:", error)
    return []
  }
}

export default async function WallpaperPage({ params }: Props) {
  const { name } = await params
  const wallpaper = await getWallpaper(name)

  if (!wallpaper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        <h1 className="text-2xl font-semibold mb-4">Wallpaper not found</h1>
        <a href="/" className="px-6 py-2 bg-[var(--accent-light)] text-black rounded-full hover:bg-[var(--accent-light)]/90 transition-all font-medium">
          Go Home
        </a>
      </div>
    )
  }

  return <WallpaperClient wallpaper={wallpaper} />
}
