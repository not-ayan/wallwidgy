"use client"

import { useState, useEffect } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import { useRouter } from "next/navigation"
import path from "path"
import { ArrowLeft } from "lucide-react"

export default function Favorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites)
        setFavorites(parsedFavorites)
      } catch (error) {
        console.error("Error loading favorites:", error)
        localStorage.setItem("favorites", "[]")
        setFavorites([])
      }
    }
  }, [])

  return (
    <div className="pt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-light text-center flex-1">Your Favorites</h1>
        </div>
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No favorites yet</p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#F7F06D] text-black px-4 py-2 rounded-full hover:bg-[#F7F06D]/90 transition-all"
            >
              Browse Wallpapers
            </button>
          </div>
        ) : (
          <WallpaperGrid wallpapers={favorites} />
        )}
      </div>
    </div>
  )
}

