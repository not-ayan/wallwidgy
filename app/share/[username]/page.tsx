"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import WallpaperGrid from "../../components/WallpaperGrid"
import { ArrowLeft, Heart, User, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import Footer from "../../components/Footer"
import BackToTop from "../../components/BackToTop"

interface UserProfile {
  username: string
  displayName: string
  imageUrl: string
  favorites: string[]
  favoritesCount: number
}

export default function SharedFavoritesPage() {
  const params = useParams()
  const username = params.username as string
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!username) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/favorites/${encodeURIComponent(username)}`)
        
        if (response.status === 404) {
          setError('User not found')
          return
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites')
        }
        
        const data = await response.json()
        setUserProfile(data)
      } catch (err) {
        console.error('Error fetching user favorites:', err)
        setError('Failed to load favorites')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserFavorites()
  }, [username])

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
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="text-center flex-1">
              {userProfile && (
                <div className="flex items-center gap-3 justify-center">
                  {userProfile.imageUrl ? (
                    <img 
                      src={userProfile.imageUrl} 
                      alt={userProfile.displayName}
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-white/60" />
                    </div>
                  )}
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {userProfile.displayName}&apos;s Favorites
                  </h1>
                </div>
              )}
            </div>
            <div className="w-[100px]"></div>
          </nav>
        </header>
      </div>

      {/* Content */}
      <div className="pt-24 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            <p className="text-white/60">Loading favorites...</p>
          </div>
        ) : error ? (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-32">
              <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500/60" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{error}</h2>
              <p className="text-white/60 text-base mb-8">
                {error === 'User not found' 
                  ? "This user doesn't exist or hasn't shared their favorites."
                  : "Something went wrong while loading the favorites."}
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 bg-[var(--accent-light)] text-black px-6 py-3 rounded-full font-medium hover:bg-[var(--accent-light)]/90 transition-all"
              >
                Explore Wallpapers
              </Link>
            </div>
          </div>
        ) : userProfile && userProfile.favorites.length > 0 ? (
          <>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <p className="text-white/60 text-sm">
                {userProfile.favoritesCount} {userProfile.favoritesCount === 1 ? 'wallpaper' : 'wallpapers'} saved
              </p>
            </div>
            <WallpaperGrid wallpapers={userProfile.favorites} />
          </>
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-32">
              <Heart className="w-16 h-16 mx-auto mb-6 text-white/20" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">No favorites yet</h2>
              <p className="text-white/60 text-base mb-8">
                {userProfile?.displayName || 'This user'} hasn&apos;t added any favorites yet.
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
