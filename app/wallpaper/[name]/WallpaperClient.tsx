"use client"

import WallpaperModal from "@/app/components/WallpaperModal"
import { useRouter } from "next/navigation"

interface Wallpaper {
  sha: string
  name: string
  width: number
  height: number
  preview_url: string
  download_url: string
  resolution: string
  platform: "Desktop" | "Mobile"
}

interface WallpaperClientProps {
  wallpaper: Wallpaper
}

export default function WallpaperClient({ wallpaper }: WallpaperClientProps) {
  const router = useRouter()
  return (
    <WallpaperModal
      isOpen={true}
      onClose={() => router.push("/")}
      wallpaper={wallpaper}
    />
  )
}
