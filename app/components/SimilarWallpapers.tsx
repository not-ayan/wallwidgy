"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RefreshCw, Sparkles, X, ArrowLeft } from "lucide-react"
import { Wallpaper } from "./WallpaperModal"

interface SimilarWallpapersProps {
  currentWallpaper: Wallpaper
  isVisible: boolean
  onClose: () => void
  onSelectWallpaper: (wallpaper: Wallpaper) => void
}

export default function SimilarWallpapers({
  currentWallpaper,
  isVisible,
  onClose,
  onSelectWallpaper,
}: SimilarWallpapersProps) {
  const [similarWallpapers, setSimilarWallpapers] = useState<Wallpaper[]>([])
  const [allSimilarWallpapers, setAllSimilarWallpapers] = useState<Wallpaper[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Calculate wallpapers per row based on screen width
  const getWallpapersPerRow = () => {
    if (typeof window === 'undefined') return 8 // Default for SSR
    const width = window.innerWidth
    if (width < 475) return 4        // xs: 4 columns
    if (width < 640) return 5        // sm: 5 columns  
    if (width < 768) return 6        // md: 6 columns
    if (width < 1024) return 8       // lg: 8 columns
    return 10                        // xl: 10 columns
  }
  
  const [wallpapersPerRow, setWallpapersPerRow] = useState(getWallpapersPerRow())

  useEffect(() => {
    if (currentWallpaper?.sha && isVisible) {
      fetchSimilarWallpapers(currentWallpaper)
      setCurrentPage(0) // Reset to first page when wallpaper changes
    }
  }, [currentWallpaper?.sha, isVisible])

  // Update wallpapers per row on window resize
  useEffect(() => {
    const handleResize = () => {
      setWallpapersPerRow(getWallpapersPerRow())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Update displayed wallpapers when page changes or wallpapers per row changes
    const startIndex = currentPage * wallpapersPerRow
    const endIndex = startIndex + wallpapersPerRow
    setSimilarWallpapers(allSimilarWallpapers.slice(startIndex, endIndex))
  }, [allSimilarWallpapers, currentPage, wallpapersPerRow])

  const fetchSimilarWallpapers = async (wallpaper: Wallpaper) => {
    setIsLoading(true)
    try {
      // Fetch all wallpapers from the index
      const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json")
      if (!response.ok) throw new Error("Failed to fetch wallpapers")
      
      const data = await response.json()
      
      // Find the current wallpaper's full data including metadata
      const currentWallpaperData = data.find((item: any) => 
        item.file_name === wallpaper.name.replace(/\.\w+$/, '') || // Remove file extension if present
        item.file_main_name === wallpaper.name
      )
      
      if (!currentWallpaperData || !currentWallpaperData.data) {
        setSimilarWallpapers([])
        setIsLoading(false)
        return
      }
      
      // Calculate similarity scores for all other wallpapers
      const wallpapersWithScores = data
        .filter((item: any) => 
          // Don't include the current wallpaper
          (item.file_name !== currentWallpaperData.file_name) && 
          item.data // Must have metadata
        )
        .map((item: any) => {
          const similarityScore = calculateSimilarity(currentWallpaperData.data, item.data)
          
          // Ensure we have proper file names with extensions
          const mainFileName = item.file_main_name || `${item.file_name}.png`
          const cacheFileName = item.file_cache_name || `${item.file_name}.webp`
          
          // Convert to our Wallpaper interface format
          const wallpaperObj: Wallpaper = {
            sha: item.file_name, // Use filename as identifier
            name: mainFileName,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
            preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${cacheFileName}`,
            resolution: item.resolution || `${item.width}x${item.height}`, // Use resolution from index, fallback to calculated
            platform: item.orientation === "Mobile" ? "Mobile" : "Desktop",
            width: item.width,
            height: item.height,
          }
          
          console.log("Created wallpaper object:", wallpaperObj); // Debug log
          
          return { wallpaper: wallpaperObj, score: similarityScore }
        })
        .sort((a: any, b: any) => b.score - a.score) // Sort by similarity score
        .map((item: any) => item.wallpaper)
      
      // Store all similar wallpapers and show first row
      setAllSimilarWallpapers(wallpapersWithScores)
      setSimilarWallpapers(wallpapersWithScores.slice(0, wallpapersPerRow))
    } catch (error) {
      console.error("Error fetching similar wallpapers:", error)
      setSimilarWallpapers([])
      setAllSimilarWallpapers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowMore = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const nextPage = currentPage + 1
      const totalPages = Math.ceil(allSimilarWallpapers.length / wallpapersPerRow)
      
      if (nextPage >= totalPages) {
        setCurrentPage(0) // Loop back to first page
      } else {
        setCurrentPage(nextPage)
      }
      setIsRefreshing(false)
    }, 300) // Small delay for visual feedback
  }

  if (!isVisible) {
    return null
  }

  const calculateSimilarity = (currentData: any, otherData: any): number => {
    let score = 0
    
    // Compare art style - high importance
    if (currentData.art_style === otherData.art_style) score += 5
    
    // Compare series - very high importance
    if (currentData.series && otherData.series && 
        currentData.series === otherData.series) score += 10
    
    // Compare character names - high importance
    if (currentData.character_names && otherData.character_names) {
      const commonCharacters = currentData.character_names.filter((char: string) => 
        otherData.character_names.includes(char)
      )
      score += commonCharacters.length * 3
    }
    
    // Compare primary colors - medium importance
    if (currentData.primary_colors && otherData.primary_colors) {
      const commonColors = currentData.primary_colors.filter((color: string) => 
        otherData.primary_colors.includes(color)
      )
      score += commonColors.length * 1.5
    }
    
    // Compare secondary colors - low importance
    if (currentData.secondary_colors && otherData.secondary_colors) {
      const commonColors = currentData.secondary_colors.filter((color: string) => 
        otherData.secondary_colors.includes(color)
      )
      score += commonColors.length * 0.75
    }
    
    // Compare color palette - medium importance
    if (currentData.color_palette === otherData.color_palette) score += 2
    
    // Compare mood - medium importance
    if (currentData.mood === otherData.mood) score += 2
    
    // Compare technique - low importance
    if (currentData.technique === otherData.technique) score += 1
    
    // Compare tags - medium importance
    if (currentData.tags && otherData.tags) {
      const commonTags = currentData.tags.filter((tag: string) => 
        otherData.tags.includes(tag)
      )
      score += commonTags.length * 0.5
    }
    
    // Compare category (anime, minimal, etc) - high importance
    if (currentData.category === otherData.category) score += 4
    
    return score
  }

  if (isLoading) {
    return (
      <div className="fixed left-2 right-2 sm:left-4 sm:right-4 z-50 max-w-7xl mx-auto" style={{ bottom: 'calc(5rem + 1rem)' }}>
        <div className="bg-black/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl p-2 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/10 rounded animate-pulse" />
              <div className="w-20 sm:w-32 h-2 sm:h-3 bg-white/10 rounded animate-pulse" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white/70" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2 md:gap-3">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-[9/16] bg-white/5 rounded-md sm:rounded-lg animate-pulse border border-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (similarWallpapers.length === 0 && allSimilarWallpapers.length === 0) {
    return (
      <div className="fixed left-2 right-2 sm:left-4 sm:right-4 z-50 max-w-4xl mx-auto" style={{ bottom: 'calc(5rem + 1rem)' }}>
        <div className="bg-black/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl p-3 sm:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400/80" />
              <h3 className="text-white/90 text-sm sm:text-base font-medium">Similar Wallpapers</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white/70" />
            </button>
          </div>
          <div className="text-center py-3 sm:py-6">
            <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />
            </div>
            <p className="text-white/60 text-xs sm:text-sm">No similar wallpapers found</p>
            <p className="text-white/40 text-xs mt-1">Try exploring other categories</p>
          </div>
        </div>
      </div>
    )
  }

  const hasMorePages = allSimilarWallpapers.length > wallpapersPerRow

  return (
    <div className="fixed left-2 right-2 sm:left-4 sm:right-4 z-50 max-w-7xl mx-auto" style={{ bottom: 'calc(5rem + 1rem)' }}>
      <div className="bg-black/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400/80" />
            <h3 className="text-white/90 text-sm sm:text-base font-medium">Similar Wallpapers</h3>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {hasMorePages && (
              <button
                onClick={handleShowMore}
                disabled={isRefreshing}
                className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-md sm:rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-white/80 text-xs sm:text-sm font-medium hidden xs:inline">
                  {isRefreshing ? 'Loading...' : 'More'}
                </span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white/70" />
            </button>
          </div>
        </div>
        
        {/* Wallpapers Grid */}
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2 md:gap-3 max-h-52 sm:max-h-60 lg:max-h-72 overflow-y-auto scrollbar-hide">
            {similarWallpapers.map((wallpaper, index) => (
              <div 
                key={`${wallpaper.sha}-${currentPage}-${index}`}
                className="group cursor-pointer transform transition-all duration-200 hover:scale-105"
                onClick={() => onSelectWallpaper(wallpaper)}
              >
                <div className="relative overflow-hidden rounded-md sm:rounded-lg border border-white/10 group-hover:border-white/30 transition-all duration-200 aspect-[9/16]">
                  <Image
                    src={wallpaper.preview_url}
                    alt={wallpaper.name}
                    fill
                    sizes="(max-width: 480px) 25vw, (max-width: 640px) 20vw, (max-width: 768px) 16.66vw, (max-width: 1024px) 14.28vw, (max-width: 1280px) 12.5vw, 10vw"
                    className="object-cover transition-all duration-200 group-hover:brightness-110"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  
                  {/* Resolution badge - responsive sizing */}
                  <div className="absolute bottom-0.5 left-0.5 right-0.5 sm:bottom-1 sm:left-1 sm:right-1">
                    <div className="bg-black/80 backdrop-blur-sm rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <p className="text-white text-[8px] sm:text-[10px] font-medium truncate text-center">
                        {wallpaper.resolution}
                      </p>
                    </div>
                  </div>
                  
                  {/* Platform indicator - responsive sizing */}
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-400/60 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
