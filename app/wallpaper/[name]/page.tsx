"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import WallpaperModal from "@/app/components/WallpaperModal"

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
  uploadDate: Date
  format: string
}

export default function WallpaperPage() {
  const { name } = useParams()
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWallpaper() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json', {
          next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch wallpapers: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid data format: expected an array')
        }

        const wallpaper = data.find((item: any) => item.file_name === name)

        if (wallpaper) {
          setWallpaper({
            sha: wallpaper.file_name,
            name: wallpaper.file_name,
            width: wallpaper.width,
            height: wallpaper.height,
            preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${wallpaper.file_cache_name}`,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${wallpaper.file_main_name}`,
            resolution: wallpaper.resolution,
            tag: wallpaper.orientation,
            platform: wallpaper.orientation,
            uploadDate: new Date(wallpaper.timestamp),
            format: wallpaper.file_name.split('.').pop() || 'unknown'
          })
        }
      } catch (error) {
        console.error("Error fetching wallpaper:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (name) {
      fetchWallpaper()
    }
  }, [name])

  if (isLoading) {
    return null
  }

  if (!wallpaper) {
    return <div>Wallpaper not found</div>
  }

  return <WallpaperModal isOpen={true} onClose={() => (window.location.href = "/")} wallpaper={wallpaper} />
}

function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
    isDownload?: boolean
  },
) {
  const transformations = options.isDownload ? [] : ["f_auto", "q_auto"]

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transformationString = transformations.join(",")
  const fileNameWithoutExtension = publicId.split(".")[0]

  if (options.isDownload) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1737134442/wallpapers/${publicId}`
  } else {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/v1/wallpapers/${fileNameWithoutExtension}`
  }
}

