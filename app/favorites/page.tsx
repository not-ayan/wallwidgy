"use client"

import { useState } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import { Heart } from "lucide-react"
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
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-aspekta selection:bg-white selection:text-black antialiased flex flex-col justify-between">
      {/* Universal Consistent Header */}
      <Header showBackButton={true} backUrl="/" />

      <main className="pt-28 sm:pt-32 pb-24 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {/* Header Block */}
        <div className="pb-6 mb-6 sm:mb-8 border-b border-white/[0.08]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#EDEDED] leading-tight">
            Favorites
          </h1>
          <p className="text-[#8E8E8E] text-xs sm:text-sm mt-1.5 tabular-nums">
            {isLoading ? (
              "Loading your collection..."
            ) : (
              `${favorites.length} ${favorites.length === 1 ? "wallpaper" : "wallpapers"} saved to your collection`
            )}
          </p>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-mono text-[#8E8E8E]">Loading your collection...</span>
          </div>
        ) : favorites.length > 0 ? (
          <>
            <WallpaperGrid
              wallpapers={favorites}
              disableContainer={true}
              onShareFavorites={() => setIsShareModalOpen(true)}
            />
            <ShareFavoritesModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              favoriteIds={favorites}
              username={user?.username}
              isSignedIn={isSignedIn}
            />
          </>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5 text-white/30">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-[#EDEDED] tracking-tight mb-2">
              No favorites saved yet
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E8E] leading-relaxed mb-8">
              Click the heart icon on any wallpaper to add it to your personal gallery and sync it across devices.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-colors"
            >
              Explore Gallery
            </Link>
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}