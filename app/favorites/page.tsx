"use client"

import { useState, useEffect } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites)
        setFavorites(parsedFavorites)
      } catch (error) {
        console.error("Error parsing favorites:", error)
        localStorage.setItem("favorites", "[]")
        setFavorites([])
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-16">
          <Link
            href="/"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Favorites</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
        {favorites.length > 0 ? (
          <WallpaperGrid wallpapers={favorites} />
        ) : (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">No favorites yet</p>
            <p className="text-white/40 text-sm mt-2">
              Add some wallpapers to your favorites to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

