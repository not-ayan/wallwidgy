"use client"

import { useState } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import { Share2, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import ShareFavoritesModal from "../components/ShareFavoritesModal"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"
import { useFavorites } from "@/hooks/use-favorites"
import { useUser } from "@clerk/nextjs"

export default function FavoritesPage() {
  const { favorites, isLoading } = useFavorites()
  const { user, isSignedIn } = useUser()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#0A0A0A] font-outfit">
      <Header showBackButton={true} backUrl="/" />

      {/* Content */}
      <div className="pt-28 pb-32">
        <div className="max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-8 mb-8 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              </div>
              <div>
                <h1 className="font-aspekta text-2xl sm:text-3xl font-light text-white tracking-tight">
                  Favorites
                </h1>
                <p className="text-white/40 text-xs sm:text-sm mt-0.5">
                  {favorites.length} {favorites.length === 1 ? 'wallpaper' : 'wallpapers'} saved
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                aria-label="Share favorites"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Gallery</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <>
            <WallpaperGrid wallpapers={favorites} />
            <ShareFavoritesModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              favoriteIds={favorites}
              username={user?.username}
              isSignedIn={isSignedIn}
            />
          </>
        ) : (
          <div className="max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
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

