"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import WallpaperModal from "@/app/components/WallpaperModal"

interface Wallpaper {
  sha: string
  name: string
  download_url: string
  resolution: string
  platform: "Desktop" | "Mobile"
}

export default function WallpaperPage() {
  const { name } = useParams()
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWallpaper() {
      try {
        const response = await fetch("/api/wallpapers")
        const wallpapers = await response.json()

        const foundWallpaper = wallpapers.find((w: any) => w.filename === name)

        if (foundWallpaper) {
          setWallpaper({
            sha: foundWallpaper.public_id,
            name: foundWallpaper.filename,
            download_url: cloudinaryUrl(foundWallpaper.public_id, { isDownload: true }),
            resolution: `${foundWallpaper.width}x${foundWallpaper.height}`,
            platform: foundWallpaper.height > foundWallpaper.width ? "Mobile" : "Desktop",
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

