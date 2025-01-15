'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Download, ArrowLeft, Trash2, Check } from 'lucide-react'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN })

interface Wallpaper {
  name: string;
  download_url: string;
  preview_url: string;
  blurHash?: string;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Wallpaper[]>([])
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFavoriteWallpapers() {
      const storedFavorites = localStorage.getItem('favorites')
      if (storedFavorites) {
        const favoriteNames = JSON.parse(storedFavorites)
        
        try {
          const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
          const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME

          if (!owner || !repo) {
            throw new Error('GitHub repository configuration is missing')
          }

          const response = await octokit.repos.getContent({
            owner,
            repo,
            path: '',
          })

          if (Array.isArray(response.data)) {
            const wallpaperFiles = response.data
              .filter((file: any) => 
                file.type === 'file' && 
                /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
                favoriteNames.includes(file.name)
              )
              .map((file: any) => ({
                name: file.name,
                download_url: file.download_url,
                preview_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/cache/webp/${file.name.replace(/\.[^/.]+$/, ".webp")}`,
              }))
            setFavorites(wallpaperFiles)
          }
        } catch (error) {
          console.error('Error fetching favorites:', error)
        }
      }
      setIsLoading(false)
    }

    fetchFavoriteWallpapers()
  }, [])

  function toggleWallpaperSelection(name: string) {
    setSelectedWallpapers(prev =>
      prev.includes(name) ? prev.filter(wallpaperName => wallpaperName !== name) : [...prev, name]
    )
  }

  function toggleSelectAll() {
    if (selectedWallpapers.length === favorites.length) {
      setSelectedWallpapers([])
    } else {
      setSelectedWallpapers(favorites.map(fav => fav.name))
    }
  }

  function removeFavorites() {
    const updatedFavorites = favorites.filter(fav => !selectedWallpapers.includes(fav.name))
    setFavorites(updatedFavorites)
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites.map(fav => fav.name)))
    setSelectedWallpapers([])
  }

  async function downloadSelectedWallpapers() {
    for (const name of selectedWallpapers) {
      const wallpaper = favorites.find(w => w.name === name)
      if (wallpaper) {
        const link = document.createElement('a')
        link.href = wallpaper.download_url
        link.download = wallpaper.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
    setSelectedWallpapers([])
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-32">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link href="/" aria-label="Back" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-4">
              {favorites.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-[13px] bg-white/10 text-white/90 px-4 py-2 rounded-full hover:bg-white/15 transition-all"
                >
                  {selectedWallpapers.length === favorites.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {selectedWallpapers.length > 0 && (
                <>
                  <button
                    onClick={removeFavorites}
                    className="text-[13px] bg-red-500/10 text-red-500 px-4 py-2 rounded-full hover:bg-red-500/15 transition-all"
                  >
                    Remove ({selectedWallpapers.length})
                  </button>
                  <button
                    onClick={downloadSelectedWallpapers}
                    className="text-[13px] bg-[#F7F06D]/10 text-[#F7F06D] px-4 py-2 rounded-full hover:bg-[#F7F06D]/15 transition-all"
                  >
                    Download ({selectedWallpapers.length})
                  </button>
                </>
              )}
            </div>
          </nav>
        </header>
      </div>

      <main className="pt-28 px-8 max-w-[1400px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-12">Your Favorites</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favorites.map(wallpaper => (
            <div key={wallpaper.name} className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={wallpaper.preview_url || "/placeholder.svg"}
                alt={wallpaper.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
                placeholder="blur"
                blurDataURL={wallpaper.blurHash || `data:image/svg+xml;base64,${Buffer.from(
                  '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a1a1a"/></svg>'
                ).toString('base64')}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-[15px] font-medium text-white/90 mb-3">{wallpaper.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWallpaperSelection(wallpaper.name)}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.name)
                          ? 'bg-[#F7F06D] text-black'
                          : 'bg-black/30 text-white hover:bg-black/40'
                      } backdrop-blur-sm transition-colors`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <a
                      href={wallpaper.download_url}
                      download
                      className="p-2 rounded-full bg-black/30 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => removeFavorites()}
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
        {isLoading && (
          <p className="text-center text-white/60">Loading your favorites...</p>
        )}
      </main>
    </div>
  )
}

