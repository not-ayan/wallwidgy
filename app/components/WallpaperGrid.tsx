"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Download,
  Heart,
  Expand,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowDownAZ,
  Clock,
  History,
  Share2,
} from "lucide-react"
import WallpaperModal from "./WallpaperModal"
import { getDatabase, ref, set, onValue, push, serverTimestamp } from "firebase/database"
import { useAuthState } from "react-firebase-hooks/auth"
import Masonry from "react-masonry-css"
import path from "path"

interface WallpaperFile {
  file_name: string;
  file_cache_name: string;
  file_main_name: string;
  width: number;
  height: number;
  resolution: string;
  orientation: "Desktop" | "Mobile";
  timestamp: string;
}

interface Wallpaper {
  sha: string;
  name: string;
  width: number;
  height: number;
  preview_url: string;
  download_url: string;
  resolution: string;
  tag: "Desktop" | "Mobile";
  platform: "Desktop" | "Mobile";
  uploadDate: Date;
}

interface WallpaperGridProps {
  wallpapers?: string[]; // Array of favorite wallpaper IDs
  categoryFilter?: string; // Category filter string
}

interface ImageDimensions {
  width: number;
  height: number;
}

export default function WallpaperGrid({ wallpapers: favoriteIds, categoryFilter }: WallpaperGridProps) {
  const [wallpapersState, setWallpapersState] = useState<Wallpaper[]>([])
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [filter, setFilter] = useState<"all" | "desktop" | "mobile">("all")
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [visibleWallpapers, setVisibleWallpapers] = useState<Wallpaper[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [displayedWallpapers, setDisplayedWallpapers] = useState<Wallpaper[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const initialLoadSize = 50
  const loadMoreSize = 20

  useEffect(() => {
    fetchWallpapers({ sortBy: "newest" })
    fetchAvailableColors()
    loadFavorites()
  }, []) // Removed currentSort dependency

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const wallpaperSha = entry.target.getAttribute("data-wallpaper-sha")
            if (wallpaperSha) {
              setVisibleWallpapers((prev) => [...prev, wallpapersState.find((w) => w.sha === wallpaperSha)!])
            }
          }
        })
      },
      { rootMargin: "100px" },
    )

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [wallpapersState])

  useEffect(() => {
    if (observerRef.current) {
      document.querySelectorAll("[data-wallpaper-sha]").forEach((el) => {
        observerRef.current!.observe(el)
      })
    }
  }, [wallpapersState])

  useEffect(() => {
    setVisibleWallpapers([]) // Reset visible wallpapers when filter changes
  }, [filter])

  // Load more wallpapers after initial load
  const loadMoreWallpapers = useCallback(() => {
    if (isLoading || !hasMore) return;

    // Get the filtered wallpapers based on current filter
    const filteredWallpapers = filter === "all" 
      ? wallpapersState 
      : wallpapersState.filter(wallpaper => wallpaper.platform.toLowerCase() === filter);

    const startIndex = displayedWallpapers.length;
    const endIndex = startIndex + loadMoreSize;
    const newWallpapers = filteredWallpapers.slice(startIndex, endIndex);
    
    if (newWallpapers.length > 0) {
      setDisplayedWallpapers(prev => [...prev, ...newWallpapers]);
      setHasMore(endIndex < filteredWallpapers.length);
    } else {
      setHasMore(false);
    }
  }, [displayedWallpapers.length, wallpapersState, isLoading, hasMore, loadMoreSize, filter]);

  // Update the useEffect for loading more wallpapers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreWallpapers();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoading, loadMoreWallpapers]);

  const fetchAvailableColors = useCallback(async () => {
    try {
      const response = await fetch("/api/colors")
      const colors = await response.json()
      setAvailableColors(colors)
    } catch (error) {
      console.error("Error fetching available colors:", error)
    }
  }, [])

  const fetchWallpapers = useCallback(
    async ({ sortBy = "newest" }: { sortBy?: string } = {}) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json', {
          next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch wallpapers: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid data format: expected an array')
        }

        let wallpapers = data.map((item: any) => ({
          sha: item.file_name,
          name: item.file_name,
          width: item.width,
          height: item.height,
          preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${item.file_cache_name}`,
          download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${item.file_main_name}`,
          resolution: item.resolution,
          tag: item.orientation,
          platform: item.orientation,
          uploadDate: new Date(item.timestamp),
          format: item.file_name.split('.').pop() || 'unknown',
          category: item.category
        }))

        // Apply category filter if provided
        if (categoryFilter) {
          wallpapers = wallpapers.filter(wallpaper => wallpaper.category === categoryFilter)
        }

        // Sort wallpapers by newest first
        wallpapers.sort((a: any, b: any) => b.uploadDate.getTime() - a.uploadDate.getTime())

        setWallpapersState(wallpapers)
        setDisplayedWallpapers(wallpapers.slice(0, initialLoadSize))
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching wallpapers:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [categoryFilter],
  )

  const loadFavorites = useCallback(() => {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites)
        setFavorites(parsedFavorites)
      } catch (error) {
        console.error("Error parsing favorites:", error)
        localStorage.setItem("favorites", "[]")
        setFavorites([])
      }
    }
  }, [])

  const handleFavorite = (wallpaper: Wallpaper) => {
    const newFavorites = favorites.includes(wallpaper.sha)
      ? favorites.filter(id => id !== wallpaper.sha)
      : [...favorites, wallpaper.sha];
    
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const handleFilterChange = useCallback((newFilter: "all" | "desktop" | "mobile") => {
    setFilter(newFilter);
    if (newFilter === "all") {
      setDisplayedWallpapers(wallpapersState.slice(0, initialLoadSize));
    } else {
      const filteredWallpapers = wallpapersState.filter(
        (wallpaper) => wallpaper.platform.toLowerCase() === newFilter
      );
      setDisplayedWallpapers(filteredWallpapers.slice(0, initialLoadSize));
    }
    setHasMore(true);
  }, [wallpapersState]);

  const showNotification = useCallback((message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }, [])

  const downloadSelectedWallpapers = useCallback(async () => {
    for (const sha of selectedWallpapers) {
      const wallpaper = wallpapersState.find((w) => w.sha === sha)
      if (wallpaper) {
        try {
          const response = await fetch(wallpaper.download_url)
          if (!response.ok) throw new Error('Failed to download')
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          // Get the file extension from the download URL
          const fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || 'jpg'
          // Ensure the filename has the correct extension
          const fileName = wallpaper.name.includes('.') ? wallpaper.name : `${wallpaper.name}.${fileExtension}`
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (error) {
          console.error(`Error downloading ${wallpaper.name}:`, error)
          showNotification(`Failed to download ${wallpaper.name}`)
        }
      }
    }
    setSelectedWallpapers([])
  }, [selectedWallpapers, wallpapersState, showNotification])

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  const handleOpenModal = useCallback(
    (wallpaper: Wallpaper) => {
      const index = wallpapersState.findIndex((w) => w.sha === wallpaper.sha)
      setSelectedIndex(index)
      setSelectedWallpaper(wallpaper)
    },
    [wallpapersState],
  )

  const handlePreviousWallpaper = useCallback(() => {
    if (selectedIndex > 0) {
      const filteredWallpapers = wallpapersState.filter((w) => filter === "all" || w.tag.toLowerCase() === filter)
      const currentFilteredIndex = filteredWallpapers.findIndex((w) => w.sha === selectedWallpaper?.sha)
      if (currentFilteredIndex > 0) {
        const prevWallpaper = filteredWallpapers[currentFilteredIndex - 1]
        const globalIndex = wallpapersState.findIndex((w) => w.sha === prevWallpaper.sha)
        setSelectedIndex(globalIndex)
        setSelectedWallpaper(prevWallpaper)
      }
    }
  }, [selectedIndex, wallpapersState, filter, selectedWallpaper])

  const handleNextWallpaper = useCallback(() => {
    const filteredWallpapers = wallpapersState.filter((w) => filter === "all" || w.tag.toLowerCase() === filter)
    const currentFilteredIndex = filteredWallpapers.findIndex((w) => w.sha === selectedWallpaper?.sha)
    if (currentFilteredIndex < filteredWallpapers.length - 1) {
      const nextWallpaper = filteredWallpapers[currentFilteredIndex + 1]
      const globalIndex = wallpapersState.findIndex((w) => w.sha === nextWallpaper.sha)
      setSelectedIndex(globalIndex)
      setSelectedWallpaper(nextWallpaper)
    }
  }, [wallpapersState, filter, selectedWallpaper])

  const handleImageLoad = useCallback((sha: string) => {
    setLoadedImages((prev) => new Set(prev).add(sha))
  }, [])

  const toggleWallpaperSelection = useCallback((sha: string) => {
    setSelectedWallpapers((prev) => {
      if (prev.includes(sha)) {
        return prev.filter((s) => s !== sha)
      } else {
        return [...prev, sha]
      }
    })
  }, [])

  const handleShare = useCallback(async (wallpaper: Wallpaper) => {
    try {
      const shareUrl = wallpaper.download_url
      const shareText = `Checkout this wallpaper: ${shareUrl}`

      if (navigator.share) {
        await navigator.share({
          text: shareText,
          url: shareUrl,
        })
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareText)
        showNotification("Link copied to clipboard!")
      }
    } catch (error: any) {
      console.error("Error sharing:", error)
      // Only show error notification if it's not an abort error (user cancelled)
      if (error.name !== 'AbortError') {
        showNotification("Unable to share or copy link")
      }
    }
  }, [showNotification])

  const handleClick = useCallback((wallpaper: Wallpaper) => {
    setClickCount(prev => prev + 1)
    
    if (clickTimeout) {
      clearTimeout(clickTimeout)
    }

    const timeout = setTimeout(() => {
      setClickCount(0)
    }, 300)

    setClickTimeout(timeout)

    if (clickCount === 1) {
      handleOpenModal(wallpaper)
      setClickCount(0)
    }
  }, [clickCount, clickTimeout, handleOpenModal])

  // Update displayed wallpapers when favorites change
  useEffect(() => {
    if (favoriteIds) {
      // If we're on the favorites page, only show favorited wallpapers
      const favoritedWallpapers = wallpapersState.filter((wallpaper): wallpaper is Wallpaper => 
        wallpaper !== null && favoriteIds.includes(wallpaper.sha)
      );
      setDisplayedWallpapers(favoritedWallpapers);
      setHasMore(false); // No need to load more on favorites page
    }
  }, [favoriteIds, wallpapersState]);

  const handleDownload = useCallback(async (wallpaper: Wallpaper) => {
    try {
      const response = await fetch(wallpaper.download_url)
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      // Get the file extension from the download URL
      const fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || 'jpg'
      // Ensure the filename has the correct extension
      const fileName = wallpaper.name.includes('.') ? wallpaper.name : `${wallpaper.name}.${fileExtension}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showNotification("Download started!")
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
      showNotification("Failed to download wallpaper")
    }
  }, [showNotification])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-[var(--accent-light)] text-black px-4 py-2 rounded-full hover:bg-[var(--accent-light)]/90 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const breakpointColumnsObj: { [key: string]: number } = favoriteIds ? {
    default: 3,
    '1100': 2,
    '700': 1
  } : categoryFilter ? {
    default: 3,
    '1100': 2,
    '700': 1
  } : {
    default: 4,
    '1400': 3,
    '1100': 2,
    '700': 1
  }

  const ImageComponent = ({ wallpaper, index }: { wallpaper: Wallpaper; index: number }) => {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    if (error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <span className="text-white/50">Failed to load image</span>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={wallpaper.preview_url}
          alt={wallpaper.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 group-hover:scale-[1.02] ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          priority={index < 6}
          quality={75}
          placeholder="blur"
          loading={index < 12 ? "eager" : "lazy"}
          onLoad={() => {
            console.log(`Successfully loaded image: ${wallpaper.preview_url}`);
            setIsLoading(false);
          }}
          onError={(e) => {
            console.error(`Failed to load image: ${wallpaper.preview_url}`, e);
            setError(true);
            setIsLoading(false);
          }}
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLzYvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLz/2wBDAR0dHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eLz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </>
    );
  };

  return (
    <div className={`${favoriteIds ? 'w-[85vw] sm:w-[70vw]' : categoryFilter ? 'w-[90vw] sm:w-[75vw]' : 'w-[90vw]'} mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative`}>
      {favoriteIds && displayedWallpapers.length > 0 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
            onClick={async () => {
              // Download all favorites
              for (const wallpaper of displayedWallpapers) {
                try {
                  const response = await fetch(wallpaper.download_url)
                  if (!response.ok) throw new Error('Failed to download')
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.href = url
                  const fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || 'jpg'
                  const fileName = wallpaper.name.includes('.') ? wallpaper.name : `${wallpaper.name}.${fileExtension}`
                  link.download = fileName
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(url)
                } catch (error) {
                  console.error(`Error downloading ${wallpaper.name}:`, error)
                  showNotification(`Failed to download ${wallpaper.name}`)
                }
              }
              showNotification("Started downloading all favorites")
            }}
            className="bg-[var(--accent-light)] text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[var(--accent-light)]/90 transition-all text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Download All
          </button>
          <button
            onClick={() => {
              localStorage.setItem("favorites", "[]")
              setFavorites([])
              showNotification("Removed all favorites")
            }}
            className="bg-black/60 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-black/70 transition-all text-xs sm:text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Remove All
          </button>
        </div>
      )}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {displayedWallpapers.map((wallpaper, index) => (
          <div key={wallpaper.sha} className={`${favoriteIds ? 'mb-3 sm:mb-4' : 'mb-4 sm:mb-6'}`}>
            <div
              className={`group relative ${favoriteIds ? 'aspect-[4/3]' : 'aspect-[3/2]'} overflow-hidden rounded-2xl bg-white/5`}
              onClick={(e) => {
                // Only handle click if clicking on the container itself
                if (e.target === e.currentTarget) {
                  handleClick(wallpaper);
                }
              }}
            >
              <ImageComponent wallpaper={wallpaper} index={index} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-medium text-white/90">{wallpaper.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWallpaperSelection(wallpaper.sha);
                      }}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.sha)
                          ? "bg-[var(--accent-light)] text-black"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all hover:scale-105`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(wallpaper);
                      }}
                      className={`p-2 rounded-full ${
                        favorites.includes(wallpaper.sha)
                          ? "bg-black/60 text-[#FF0000]"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all hover:scale-105`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(wallpaper.sha) ? "fill-[#FF0000]" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                    >
                      <Expand className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-[var(--accent-light)] text-black px-2 py-1 rounded-full text-xs font-medium">
                {wallpaper.resolution}
              </div>
              <div className="absolute top-3 right-3 bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium">
                {wallpaper.tag}
              </div>
            </div>
          </div>
        ))}
      </Masonry>

      {selectedWallpapers.length > 0 && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={downloadSelectedWallpapers}
            className="bg-[var(--accent-light)]/10 text-[var(--accent-light)] px-5 py-2.5 rounded-full hover:bg-[var(--accent-light)]/15 transition-all text-[13px] font-medium flex items-center gap-2 animate-bounce backdrop-blur-lg"
            style={{ width: "auto" }}
          >
            <Download className="w-4 h-4" />
            Download Selected ({selectedWallpapers.length})
          </button>
        </div>
      )}

      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 flex gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1 rounded-full text-xs ${filter === "all" ? "bg-[var(--accent-light)] text-black" : "text-white"}`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("desktop")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "desktop" ? "bg-[var(--accent-light)] text-black" : "text-white"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => handleFilterChange("mobile")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "mobile" ? "bg-[var(--accent-light)] text-black" : "text-white"
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
          wallpaper={{
            ...selectedWallpaper,
            platform: selectedWallpaper?.tag === "Mobile" ? "Mobile" : "Desktop",
          }}
          onPrevious={handlePreviousWallpaper}
          onNext={handleNextWallpaper}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < wallpapersState.length - 1}
        />
      )}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          ) : (
            <div className="text-white/50">Scroll to load more</div>
          )}
        </div>
      )}
    </div>
  )
}

function getResolutionLabel(width: number, height: number): string {
  const resolutionPixels = width * height
  if (resolutionPixels >= 1920 * 1080 && resolutionPixels < 2560 * 1440) {
    return "1080p"
  } else if (resolutionPixels >= 2560 * 1440 && resolutionPixels < 3840 * 2160) {
    return "1440p"
  } else if (resolutionPixels >= 3840 * 2160 && resolutionPixels < 7680 * 4320) {
    return "4K"
  } else if (resolutionPixels >= 7680 * 4320 && resolutionPixels < 15360 * 8640) {
    return "8K"
  } else if (resolutionPixels >= 15360 * 8640) {
    return "16K"
  } else {
    return "Below 1080p"
  }
}

