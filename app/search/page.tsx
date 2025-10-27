'use client'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, ArrowLeft, Filter, Grid3X3, List } from "lucide-react"
import { Suspense } from "react"
import WallpaperGrid from "../components/WallpaperGrid"
import SearchBar from "../components/SearchBar"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

interface Wallpaper {
  sha: string
  name: string
  download_url: string
  preview_url: string
  resolution: string
  platform: "Desktop" | "Mobile"
  width: number
  height: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deviceFilter, setDeviceFilter] = useState<"all" | "desktop" | "mobile">("all")
  const [totalResults, setTotalResults] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      // Fetch all wallpapers from the index
      const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json")
      if (!response.ok) throw new Error("Failed to fetch wallpapers")
      
      const data = await response.json()
      
      // Search through the data field for matches
      const matchedWallpapers = data
        .filter((item: any) => {
          if (!item.data) return false
          
          // Convert query and data fields to lowercase for case-insensitive search
          const queryLower = searchQuery.toLowerCase()
          
          // Fields to search in
          const searchableFields = [
            item.file_name || '',
            item.data.art_style || '',
            item.data.series || '',
            item.data.category || '',
            item.data.mood || '',
            item.data.technique || '',
            item.data.color_palette || ''
          ]
          
          // Check array fields
          const arrays = [
            item.data.character_names || [],
            item.data.primary_colors || [],
            item.data.secondary_colors || [],
            item.data.tags || []
          ]
          
          // Check if any field contains the query
          return searchableFields.some(field => field.toLowerCase().includes(queryLower)) ||
                 arrays.some(arr => arr.some((val: string) => val.toLowerCase().includes(queryLower)))
        })
        .map((item: any) => {
          // Convert to Wallpaper interface
          const mainFileName = item.file_main_name || `${item.file_name}.png`
          const cacheFileName = item.file_cache_name || `${item.file_name}.webp`
          
          return {
            sha: item.file_name,
            name: mainFileName,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
            preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${cacheFileName}`,
            resolution: item.resolution || `${item.width}x${item.height}`,
            platform: item.orientation === "Mobile" ? "Mobile" : "Desktop",
            width: item.width,
            height: item.height,
          }
        })
      
      // Apply device filter
      const filteredResults = deviceFilter === "all" 
        ? matchedWallpapers 
        : matchedWallpapers.filter((wallpaper: Wallpaper) => wallpaper.platform.toLowerCase() === deviceFilter)
      
      setResults(filteredResults)
      setTotalResults(filteredResults.length)
    } catch (error) {
      console.error("Error searching wallpapers:", error)
      setResults([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query, deviceFilter])

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 group bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-4 h-4 text-[#F7F06D] group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 text-white/70 hover:text-white transition-all"
              aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Search Results
          </h1>
          {query && (
            <p className="text-white/70 text-lg">
              {isLoading ? "Searching..." : `${totalResults} results for "${query}"`}
            </p>
          )}
        </div>

        {/* Device Filter */}
        {(results.length > 0 || isLoading) && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
              <span className="text-white/70 text-sm font-medium px-3">Device:</span>
              {[
                { key: "all", label: "All" },
                { key: "desktop", label: "Desktop" },
                { key: "mobile", label: "Mobile" }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setDeviceFilter(option.key as "all" | "desktop" | "mobile")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    deviceFilter === option.key
                      ? "bg-[#F7F06D] text-black shadow-sm"
                      : "text-white/60 hover:text-white/80 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-[9/16] bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "space-y-4"
          }>
            {results.map((wallpaper, index) => (
              <Link
                key={wallpaper.sha}
                href={`/wallpaper/${wallpaper.name.replace(/\.\w+$/, '')}`}
                className={`group ${viewMode === "list" ? "flex items-center gap-4 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all" : ""}`}
              >
                <div className={`relative overflow-hidden rounded-lg border border-white/10 group-hover:border-white/30 transition-all duration-300 ${
                  viewMode === "grid" 
                    ? "aspect-[9/16] transform group-hover:translate-y-[-2px] group-hover:shadow-xl" 
                    : "w-20 h-28 flex-shrink-0"
                }`}>
                  <img
                    src={wallpaper.preview_url}
                    alt={wallpaper.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Platform indicator */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shadow-sm ${
                      wallpaper.platform === "Mobile" 
                        ? "bg-blue-500/80 text-white" 
                        : "bg-green-500/80 text-white"
                    }`}>
                      {wallpaper.platform === "Mobile" ? "📱" : "🖥️"}
                    </span>
                  </div>

                  {viewMode === "grid" && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  )}
                </div>
                
                {viewMode === "list" && (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate mb-1">
                      {wallpaper.name.replace(/\.\w+$/, '')}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span>{wallpaper.resolution}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        wallpaper.platform === "Mobile" 
                          ? "bg-blue-500/20 text-blue-300" 
                          : "bg-green-500/20 text-green-300"
                      }`}>
                        {wallpaper.platform}
                      </span>
                    </div>
                  </div>
                )}

                {viewMode === "grid" && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <p className="text-white text-xs font-medium truncate">
                        {wallpaper.name.replace(/\.\w+$/, '')}
                      </p>
                      <p className="text-white/70 text-xs">
                        {wallpaper.resolution}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20">
            <div className="bg-white/5 rounded-full p-6 mb-6 w-fit mx-auto">
              <Search className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No results found</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              We couldn't find any wallpapers matching "{query}". Try different keywords or browse our categories.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/categories" 
                className="px-6 py-3 bg-[#F7F06D] text-black font-semibold rounded-lg hover:bg-[#F7F06D]/90 transition-all"
              >
                Browse Categories
              </Link>
              <Link 
                href="/" 
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/5 rounded-full p-6 mb-6 w-fit mx-auto">
              <Search className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Start searching</h2>
            <p className="text-white/60 mb-8">
              Enter a search term to find wallpapers
            </p>
          </div>
        )}
      </div>

      <Footer />
      <BackToTop />
      <SearchBar />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}