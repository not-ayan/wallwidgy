"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { useCallback } from "react"
// SmartImage: tries optimized, then unoptimized, then shows error UI
function SmartImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  style = {},
  sizes,
  priority = false,
  ...rest
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  [key: string]: any;
}) {
  const [error, setError] = useState(false);

  const handleImageError = useCallback(() => {
    setError(true);
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md sm:rounded-lg">
        <span className="text-white/60 text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      style={style}
      sizes={sizes}
      priority={priority}
      unoptimized={true}
      onError={handleImageError}
      {...rest}
    />
  );
}
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Wallpaper {
  name: string
  sha: string
  preview_url: string
  resolution: string
}

// Create a separate component for the search content that uses useSearchParams
function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query) {
      searchWallpapers(query)
    }
  }, [query])

  const searchWallpapers = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wallpapers/search?term=${encodeURIComponent(term)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error searching wallpapers:', error)
      setError('Failed to load search results. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchWallpapers(searchQuery)
    
    // Update URL with search query
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchQuery)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative flex w-full">
          <Input
            type="text"
            placeholder="Search wallpapers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-lg"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          <p className="mt-4 text-white/70">Searching for wallpapers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => searchWallpapers(searchQuery)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md text-sm text-white"
          >
            Try Again
          </button>
        </div>
      ) : results.length === 0 && query ? (
        <div className="text-center py-12">
          <p className="text-white/70">No wallpapers found for "{query}"</p>
        </div>
      ) : (
        <>
          {results.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium text-white/90">
                {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
              </h2>
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {results.map((wallpaper) => (
              <Link
                key={wallpaper.sha}
                href={`/wallpaper/${wallpaper.name.replace(/\.\w+$/, '')}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-md sm:rounded-lg border border-white/10 group-hover:border-white/30 transition-all duration-300 aspect-[9/16] transform group-hover:translate-y-[-5px] group-hover:shadow-xl">
                  <SmartImage
                    src={wallpaper.preview_url}
                    alt={wallpaper.name}
                    fill
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 480px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16.66vw"
                    className="object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  
                  {/* Resolution badge */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <p className="text-white text-xs font-medium truncate">
                        {wallpaper.resolution}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Main component that wraps SearchContent in a Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          <p className="mt-4 text-white/70">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}