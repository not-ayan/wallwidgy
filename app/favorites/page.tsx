"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Download, ArrowLeft, Trash2 } from "lucide-react"

interface Wallpaper {
  public_id: string
  name: string
  preview_url: string
  download_url: string
  resolution: string
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Wallpaper[]>([])
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  async function fetchFavorites() {
    try {
      setIsLoading(true)
      const storedFavorites = localStorage.getItem("favorites")
      if (!storedFavorites) {
        setFavorites([])
        return
      }

      const favoriteIds = JSON.parse(storedFavorites)
      const response = await fetch("/api/wallpapers")
      const allWallpapers = await response.json()

      const favoriteWallpapers = allWallpapers
        .filter((wallpaper: any) => favoriteIds.includes(wallpaper.public_id))
        .map((wallpaper: any) => ({
          public_id: wallpaper.public_id,
          name: wallpaper.filename,
          preview_url: cloudinaryUrl(wallpaper.public_id, {
            width: 800,
            height: 600,
            crop: "fill",
            quality: "auto",
            format: "auto",
          }),
          download_url: cloudinaryUrl(wallpaper.public_id, {
            quality: "auto",
            format: "auto",
          }),
          resolution: `${wallpaper.width}x${wallpaper.height}`,
        }))

      setFavorites(favoriteWallpapers)
    } catch (error) {
      console.error("Error fetching favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function removeFavorite(public_id: string) {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      const favoriteIds = JSON.parse(storedFavorites)
      const updatedFavorites = favoriteIds.filter((id: string) => id !== public_id)
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
      await fetchFavorites()
    }
  }

  async function downloadSelectedWallpapers() {
    for (const public_id of selectedWallpapers) {
      const wallpaper = favorites.find((w) => w.public_id === public_id)
      if (wallpaper) {
        const response = await fetch(wallpaper.download_url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = wallpaper.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    }
    setSelectedWallpapers([])
  }

  function showNotification(message: string) {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  function toggleWallpaperSelection(public_id: string) {
    setSelectedWallpapers((prev) =>
      prev.includes(public_id) ? prev.filter((id) => id !== public_id) : [...prev, public_id],
    )
  }

  function addToFavorites(sha: string) {
    const storedFavorites = localStorage.getItem("favorites")
    const currentFavorites = storedFavorites ? JSON.parse(storedFavorites) : []

    if (!currentFavorites.includes(sha)) {
      const updatedFavorites = [...currentFavorites, sha]
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
      showNotification("Added to favorites!")
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-32">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </nav>
        </header>
      </div>

      <main className="pt-28 px-8 max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center">Your Favorites</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favorites.map((wallpaper) => (
            <div
              key={wallpaper.public_id}
              className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/5"
            >
              <Image
                src={wallpaper.preview_url || "/placeholder.svg"}
                alt={wallpaper.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-[15px] font-medium text-white/90 mb-3">{wallpaper.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWallpaperSelection(wallpaper.public_id)}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.public_id)
                          ? "bg-[#F7F06D] text-black"
                          : "bg-black/30 text-white hover:bg-black/40"
                      } backdrop-blur-sm transition-colors`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFavorite(wallpaper.public_id)}
                      className="p-2 rounded-full bg-black/30 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {favorites.length === 0 && !isLoading && (
          <p className="text-center text-white/60">You haven't added any favorites yet.</p>
        )}
        {isLoading && <p className="text-center text-white/60">Loading your favorites...</p>}
      </main>

      {selectedWallpapers.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={downloadSelectedWallpapers}
            className="bg-[#F7F06D]/10 text-[#F7F06D] px-5 py-2.5 rounded-full hover:bg-[#F7F06D]/15 transition-all text-[13px] font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Selected ({selectedWallpapers.length})
          </button>
        </div>
      )}
    </div>
  )
}

function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
  },
) {
  const transformations = []

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)
  if (options.quality) transformations.push(`q_${options.quality}`)
  if (options.format) transformations.push(`f_${options.format}`)

  const transformationString = transformations.join(",")

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`
}

