'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Heart, Share2, Expand, RefreshCw } from 'lucide-react'
import { Octokit } from '@octokit/rest'
import WallpaperModal from './WallpaperModal'

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN })

interface Wallpaper {
  name: string;
  download_url: string;
  preview_url: string;
  resolution: string;
  tag: 'Mobile' | 'Desktop';
  blurHash?: string;
  uploadDate: Date;
  tags: string[];
  colors: string[];
}

interface WallpaperGridProps {
  sortBy?: 'newest' | 'default';
  limit?: number;
  category?: string;
  color?: string;
}

export default function WallpaperGrid({ sortBy = 'default', limit, category, color }: WallpaperGridProps) {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'desktop' | 'mobile'>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  useEffect(() => {
    fetchWallpapers()
    const storedFavorites = localStorage.getItem('favorites')
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }
  }, [retryCount, category, color])

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  async function fetchWallpapers() {
    try {
      setIsLoading(true);
      setError(null);
      
      const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER;
      const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;

      if (!owner || !repo) {
        throw new Error('GitHub repository owner or name is not set in environment variables.');
      }

      console.log(`Fetching wallpapers from ${owner}/${repo}`);

      const [filesResponse, tagsResponse] = await Promise.all([
        octokit.repos.getContent({
          owner,
          repo,
          path: '',
        }),
        octokit.repos.getContent({
          owner,
          repo,
          path: 'tags.json',
        }),
      ]);

      if (!Array.isArray(filesResponse.data)) {
        throw new Error('Unexpected response format for files');
      }

      if (!('content' in tagsResponse.data)) {
        throw new Error('Unexpected response format for tags');
      }

      const tags = JSON.parse(Buffer.from(tagsResponse.data.content, 'base64').toString());

      let wallpaperFiles = filesResponse.data
        .filter((file: any) => file.type === 'file' && /\.(jpg|jpeg|png|gif)$/i.test(file.name))
        .map((file: any) => {
          const fileInfo = tags[file.name];
          return {
            name: file.name,
            download_url: file.download_url,
            preview_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/cache/webp/${file.name.replace(/\.[^/.]+$/, ".webp")}`,
            resolution: fileInfo?.resolution || '',
            tag: fileInfo?.platform || 'Desktop',
            tags: fileInfo?.tags || [],
            colors: fileInfo?.colors || [],
            uploadDate: new Date(file.created_at || Date.now()),
          };
        });

      if (category) {
        wallpaperFiles = wallpaperFiles.filter(file => file.tags.includes(category));
      }

      if (color) {
        wallpaperFiles = wallpaperFiles.filter(file => file.colors.includes(color));
      }

      if (sortBy === 'newest') {
        wallpaperFiles.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
      }

      console.log(`Found ${wallpaperFiles.length} wallpapers`);
      setWallpapers(wallpaperFiles);
    } catch (err: any) {
      console.error('Error fetching wallpapers:', err);
      setError(`Failed to fetch wallpapers. ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleWallpaperSelection(name: string) {
    setSelectedWallpapers(prev =>
      prev.includes(name) ? prev.filter(wallpaperName => wallpaperName !== name) : [...prev, name]
    )
  }

  function toggleFavorite(name: string) {
    setFavorites(prev =>
      prev.includes(name) ? prev.filter(favName => favName !== name) : [...prev, name]
    )
  }

  async function downloadWallpapers() {
    const downloads = selectedWallpapers.map(name => {
      const wallpaper = wallpapers.find(w => w.name === name)
      if (wallpaper) {
        return fetch(wallpaper.download_url)
          .then(response => response.blob())
          .then(blob => {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = wallpaper.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
          })
      }
      return Promise.resolve()
    })

    await Promise.all(downloads)
    setSelectedWallpapers([])
  }

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  const handleShare = async (wallpaper: Wallpaper) => {
    try {
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.name)}`;
      
      if (navigator.canShare) {
        try {
          await navigator.share({
            title: 'Minimalist Wallpaper',
            text: `Check out this minimalist wallpaper: ${wallpaper.name}`,
            url: shareUrl
          });
        } catch (shareError: any) {
          // If share fails (e.g., permission denied), fall back to clipboard
          await navigator.clipboard.writeText(shareUrl);
          showNotification('Link copied to clipboard!');
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showNotification('Link copied to clipboard!');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      showNotification('Unable to share or copy link');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleFilterChange = (newFilter: 'all' | 'desktop' | 'mobile') => {
    setFilter(newFilter)
  }

  const handleOpenModal = (wallpaper: Wallpaper) => {
    const index = wallpapers.findIndex(w => w.name === wallpaper.name)
    setSelectedIndex(index)
    setSelectedWallpaper(wallpaper)
  }

  const handlePreviousWallpaper = () => {
    if (selectedIndex > 0) {
      const filteredWallpapers = wallpapers.filter(w => 
        filter === 'all' || w.tag.toLowerCase() === filter
      )
      const currentFilteredIndex = filteredWallpapers.findIndex(w => 
        w.name === selectedWallpaper?.name
      )
      if (currentFilteredIndex > 0) {
        const prevWallpaper = filteredWallpapers[currentFilteredIndex - 1]
        const globalIndex = wallpapers.findIndex(w => w.name === prevWallpaper.name)
        setSelectedIndex(globalIndex)
        setSelectedWallpaper(prevWallpaper)
      }
    }
  }

  const handleNextWallpaper = () => {
    const filteredWallpapers = wallpapers.filter(w => 
      filter === 'all' || w.tag.toLowerCase() === filter
    )
    const currentFilteredIndex = filteredWallpapers.findIndex(w => 
      w.name === selectedWallpaper?.name
    )
    if (currentFilteredIndex < filteredWallpapers.length - 1) {
      const nextWallpaper = filteredWallpapers[currentFilteredIndex + 1]
      const globalIndex = wallpapers.findIndex(w => w.name === nextWallpaper.name)
      setSelectedIndex(globalIndex)
      setSelectedWallpaper(nextWallpaper)
    }
  }

  if (isLoading) {
    return <div className="text-center py-20">Loading wallpapers...</div>
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-[#F7F06D] text-black px-4 py-2 rounded-full hover:bg-[#F7F06D]/90 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 pb-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {wallpapers
          .filter(wallpaper => filter === 'all' || wallpaper.tag.toLowerCase() === filter)
          .map(wallpaper => (
          <div key={wallpaper.name} className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            <Image
              src={wallpaper.preview_url || "/placeholder.svg"}
              alt={wallpaper.name}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={wallpaper.blurHash || `data:image/svg+xml;base64,${Buffer.from(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a1a1a"/></svg>'
              ).toString('base64')}`}
              loading="lazy"
            />
            {wallpaper.resolution && (
              <div className="absolute top-3 left-3 bg-[#F7F06D] text-black px-2 py-1 rounded-full text-xs font-medium">
                {wallpaper.resolution}
              </div>
            )}
            {wallpaper.tag && (
              <div className="absolute top-3 right-3 bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium">
                {wallpaper.tag}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-medium text-white/90">{wallpaper.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWallpaperSelection(wallpaper.name)}
                    className={`p-2 rounded-full ${
                      selectedWallpapers.includes(wallpaper.name)
                        ? 'bg-[#F7F06D] text-black'
                        : 'bg-black/60 text-white hover:bg-black/70'
                    } backdrop-blur-sm transition-all hover:scale-105`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleFavorite(wallpaper.name)}
                    className={`p-2 rounded-full ${
                      favorites.includes(wallpaper.name)
                        ? 'bg-[#F7F06D] text-black'
                        : 'bg-black/60 text-white hover:bg-black/70'
                    } backdrop-blur-sm transition-all hover:scale-105`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShare(wallpaper)}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(wallpaper)}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <Expand className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedWallpapers.length > 0 && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={downloadWallpapers}
            className="bg-[#F7F06D]/10 text-[#F7F06D] px-5 py-2.5 rounded-full hover:bg-[#F7F06D]/15 transition-all text-[13px] font-medium flex items-center gap-2 animate-bounce backdrop-blur-lg"
          >
            <Download className="w-4 h-4" />
            Download Selected ({selectedWallpapers.length})
          </button>
        </div>
      )}

      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 flex gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === 'all' ? 'bg-[#F7F06D] text-black' : 'text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('desktop')}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === 'desktop' ? 'bg-[#F7F06D] text-black' : 'text-white'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => handleFilterChange('mobile')}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === 'mobile' ? 'bg-[#F7F06D] text-black' : 'text-white'
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {selectedWallpaper && (
        <WallpaperModal
          isOpen={true}
          onClose={() => {
            setSelectedWallpaper(null)
            setSelectedIndex(-1)
          }}
          wallpaper={selectedWallpaper}
          onPrevious={handlePreviousWallpaper}
          onNext={handleNextWallpaper}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < wallpapers.length - 1}
        />
      )}
    </div>
  )
}

