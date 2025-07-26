"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
// import Image from "next/image" // Removed: not used, SmartImage uses <img>
import { useCallback } from "react"
import Image from "next/image"
import React from "react"
// StableImageComponent: same as WallpaperGrid
const StableImageComponent = React.memo(({ wallpaper, index }: { wallpaper: Wallpaper; index: number }) => {
  const [error, setError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [forceUnoptimized, setForceUnoptimized] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const stableId = `image-${wallpaper.sha}`;

  const handleImageError = useCallback(() => {
    if (!forceUnoptimized) {
      setForceUnoptimized(true);
      setError(false);
    } else {
      setError(true);
    }
  }, [forceUnoptimized]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
        <span className="text-white/50">Failed to load image</span>
      </div>
    );
  }

  return (
    <>
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
      <Image
        id={stableId}
        src={wallpaper.preview_url}
        alt={wallpaper.name}
        fill
        sizes="(max-width: 480px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16.66vw"
        className={`object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105 ${isImageLoaded ? 'opacity-100 transition-opacity' : 'opacity-0'}`}
        priority={index < 4}
        quality={isMobile ? 65 : 75}
        loading={index < 8 ? "eager" : "lazy"}
        decoding="async"
        onLoadingComplete={() => setIsImageLoaded(true)}
        onError={handleImageError}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALiAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLzYvLy8vLy8vLy8vLy8vLz/2wBDAR0dHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eLz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        unoptimized={forceUnoptimized}
      />
    </>
  );
}, (prevProps, nextProps) => prevProps.wallpaper.sha === nextProps.wallpaper.sha);
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Wallpaper {
  name: string;
  sha: string;
  preview_url: string;
  resolution: string;
}

// SearchContent: handles search state, fetch, and rendering
function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      fetchWallpapers(initialQuery);
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const fetchWallpapers = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/wallpapers/search?term=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to load search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchWallpapers(searchQuery);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative flex w-full">
          <Input
            type="text"
            placeholder="Search wallpapers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
            onClick={() => fetchWallpapers(searchQuery)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md text-sm text-white"
          >
            Try Again
          </button>
        </div>
      ) : results.length === 0 && initialQuery ? (
        <div className="text-center py-12">
          <p className="text-white/70">No wallpapers found for "{initialQuery}"</p>
        </div>
      ) : (
        <>
          {results.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium text-white/90">
                {results.length} {results.length === 1 ? 'result' : 'results'} for "{initialQuery}"
              </h2>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((wallpaper) => (
              <div key={wallpaper.sha} className="group relative bg-white/5 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-white/10">
                <Link href={`/wallpaper/${wallpaper.name.replace(/\.[^.]+$/, '')}`}
                  className="block aspect-[9/16] relative">
                  <StableImageComponent
                    wallpaper={wallpaper}
                    index={0}
                  />
                  {/* Overlay for hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
                </Link>
                {/* Bottom bar with resolution and download */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-sm gap-2">
                  <span className="text-xs text-white/80 font-medium truncate">{wallpaper.resolution}</span>
                  <button
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Download"
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      const link = document.createElement('a');
                      link.href = wallpaper.preview_url;
                      link.download = wallpaper.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
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