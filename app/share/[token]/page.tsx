'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Download, Heart } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Wallpaper {
  name: string;
  download_url: string;
  preview_url: string;
  resolution?: string;
}

export default function SharePage() {
  const { token } = useParams()
  const [favorites, setFavorites] = useState<Wallpaper[]>([])
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFavorites() {
      try {
        // Get user data from token
        const { data: tokenData, error: tokenError } = await supabase
          .from('access_tokens')
          .select('user_id')
          .eq('token', token)
          .single()

        if (tokenError) throw new Error('Invalid token')

        // Get user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', tokenData.user_id)
          .single()

        if (userError) throw userError

        setUserName(userData.name)

        // Get user's favorites
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('user_favorites')
          .select('wallpaper_name')
          .eq('user_id', tokenData.user_id)

        if (favoritesError) throw favoritesError

        // Fetch wallpaper details from GitHub
        const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
        const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME

        if (!owner || !repo) {
          throw new Error('GitHub configuration missing')
        }

        const wallpaperPromises = favoritesData.map(async (fav) => {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${fav.wallpaper_name}`,
            {
              headers: {
                Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN}`,
              },
            }
          )
          const data = await response.json()
          return {
            name: fav.wallpaper_name,
            download_url: data.download_url,
            preview_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/cache/${fav.wallpaper_name}`,
          }
        })

        const wallpapers = await Promise.all(wallpaperPromises)
        setFavorites(wallpapers)
      } catch (err: any) {
        console.error('Error fetching favorites:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavorites()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-pulse">Loading favorites...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 px-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">{userName}'s Favorite Wallpapers</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favorites.map((wallpaper) => (
            <div key={wallpaper.name} className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={wallpaper.preview_url}
                alt={wallpaper.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-[15px] font-medium text-white/90 mb-3">{wallpaper.name}</h3>
                  <div className="flex items-center gap-2">
                    <a
                      href={wallpaper.download_url}
                      download
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button className="p-2 rounded-full bg-[#F7F06D] text-black hover:bg-[#F7F06D]/90 backdrop-blur-sm transition-all hover:scale-105">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {favorites.length === 0 && (
          <p className="text-center text-white/60">No favorites found.</p>
        )}
      </div>
    </div>
  )
}

