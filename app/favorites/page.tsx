"use client"

import { useState, useEffect } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import { ArrowLeft, Share2, Heart } from "lucide-react"
import Link from "next/link"
import ShareFavoritesModal from "../components/ShareFavoritesModal"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
        <header className="px-4 sm:px-12 py-5">
          <nav className="flex justify-between items-center max-w-[1600px] mx-auto">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 group bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 justify-center">
                <Heart className="w-6 h-6 text-[#FF0000]" />
                My Favorites
              </h1>
            </div>
            {favorites.length > 0 && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-white/70 hover:text-white"
                aria-label="Share favorites"
                title="Share favorites"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </nav>
        </header>
      </div>

      {/* Content */}
      <div className="pt-24 pb-32">
        {favorites.length > 0 ? (
          <>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <p className="text-white/60 text-sm">
                {favorites.length} {favorites.length === 1 ? 'wallpaper' : 'wallpapers'} saved
              </p>
            </div>
            <WallpaperGrid wallpapers={favorites} />
            <ShareFavoritesModal 
              isOpen={isShareModalOpen} 
              onClose={() => setIsShareModalOpen(false)}
              favoriteIds={favorites}
            />
          </>
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-32">
              <Heart className="w-16 h-16 mx-auto mb-6 text-white/20" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">No favorites yet</h2>
              <p className="text-white/60 text-base mb-8">
                Start adding wallpapers to your favorites to see them here
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 bg-[var(--accent-light)] text-black px-6 py-3 rounded-full font-medium hover:bg-[var(--accent-light)]/90 transition-all"
              >
                Explore Wallpapers
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

