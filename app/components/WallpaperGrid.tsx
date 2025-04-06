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
}

interface Wallpaper {
  sha: string;
  name: string;
  width: number;
  height: number;
  preview_url: string;
  download_url: string;
  resolution: string;
  tag: "Mobile" | "Desktop";
  platform: "Mobile" | "Desktop";
  uploadDate: Date;
}

interface WallpaperGridProps {
  sortBy?: "newest" | "default" | "name" | "color"
  limit?: number
  category?: string
  color?: string
  wallpapers?: string[]
}

interface ImageDimensions {
  width: number;
  height: number;
}

export default function WallpaperGrid({
  sortBy = "newest",
  limit = 25,
  category,
  color,
  wallpapers,
}: WallpaperGridProps) {
  const [wallpapersState, setWallpapers] = useState<Wallpaper[]>([])
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
  const initialLoadSize = 30
  const loadMoreSize = 25

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

  // Load more wallpapers when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreWallpapers()
        }
      },
      { threshold: 0.5 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [hasMore, isLoading])

  // Load more wallpapers after initial load
  const loadMoreWallpapers = useCallback(() => {
    const startIndex = page * loadMoreSize
    const endIndex = startIndex + loadMoreSize
    const newWallpapers = wallpapersState.slice(startIndex, endIndex)
    
    if (newWallpapers.length > 0) {
      setDisplayedWallpapers(prev => [...prev, ...newWallpapers])
      setPage(prev => prev + 1)
    } else {
      setHasMore(false)
    }
  }, [page, wallpapersState])

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
    async ({ sortBy = "name" }: { sortBy?: "newest" | "oldest" | "name" } = {}) => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch the index.json file
        const indexResponse = await fetch('https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json', {
          cache: 'force-cache',
          next: { revalidate: 3600 } // Cache for 1 hour
        })
        
        if (!indexResponse.ok) {
          throw new Error(`Failed to fetch index.json: ${indexResponse.status}`)
        }
        
        const wallpaperFiles: WallpaperFile[] = await indexResponse.json()
        console.log('Fetched wallpaper files:', wallpaperFiles.length)

        // Process wallpapers in smaller batches for better performance
        const batchSize = 5
        const wallpapers: Wallpaper[] = []
        
        for (let i = 0; i < wallpaperFiles.length; i += batchSize) {
          const batch = wallpaperFiles.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (file) => {
              try {
                // Preload the image in the background
                const img = new window.Image()
                const previewUrl = `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${file.file_cache_name}`
                
                // Start loading the image immediately
                img.src = previewUrl
                
                return {
                  sha: file.file_name,
                  name: file.file_name,
                  width: file.width,
                  height: file.height,
                  preview_url: previewUrl,
                  download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${file.file_main_name}`,
                  resolution: file.resolution,
                  tag: file.orientation,
                  platform: file.orientation,
                  uploadDate: new Date(),
                }
              } catch (error) {
                console.error(`Error processing ${file.file_name}:`, error)
                return null
              }
            })
          )

          const validResults = batchResults.filter((w): w is Wallpaper => w !== null)
          wallpapers.push(...validResults)
          
          // Update state with current progress
          setWallpapers([...wallpapers])
          setDisplayedWallpapers(wallpapers.slice(0, initialLoadSize))
          
          // Small delay between batches to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Apply sorting
        switch (sortBy) {
          case "newest":
            wallpapers.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
            break
          case "oldest":
            wallpapers.sort((a, b) => a.uploadDate.getTime() - b.uploadDate.getTime())
            break
          case "name":
            wallpapers.sort((a, b) => a.name.localeCompare(b.name))
            break
          default:
            break
        }

        setWallpapers(wallpapers)
        setDisplayedWallpapers(wallpapers.slice(0, initialLoadSize))
        setHasMore(wallpapers.length > initialLoadSize)
      } catch (err: any) {
        console.error("Error fetching wallpapers:", err)
        setError(`Failed to fetch wallpapers. ${err.message || ""}`)
      } finally {
        setIsLoading(false)
      }
    },
    [],
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

  const toggleFavorite = useCallback((sha: string) => {
    setFavorites((prevFavorites) => {
      const newFavorites = prevFavorites.includes(sha)
        ? prevFavorites.filter((id) => id !== sha)
        : [...prevFavorites, sha]
      try {
        localStorage.setItem("favorites", JSON.stringify(newFavorites))
      } catch (error) {
        console.error("Error saving favorites:", error)
      }
      return newFavorites
    })
  }, [])

  const handleFilterChange = useCallback((newFilter: "all" | "desktop" | "mobile") => {
    setFilter(newFilter)
  }, [])

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
          link.download = wallpaper.name
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
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.sha)}`

      if (navigator.share) {
        await navigator.share({
          title: "Minimalist Wallpaper",
          text: `Check out this minimalist wallpaper: ${wallpaper.name}`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        showNotification("Link copied to clipboard!")
      }
    } catch (error: any) {
      console.error("Error sharing:", error)
      showNotification("Unable to share or copy link")
    }
  }, [showNotification])

  const handleClick = useCallback((wallpaper: Wallpaper, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If the image is already loaded, just open the modal
    if (loadedImages.has(wallpaper.sha)) {
      handleOpenModal(wallpaper);
      return;
    }
    
    setClickCount(prev => prev + 1);
    
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    const timeout = setTimeout(() => {
      setClickCount(0);
    }, 300);

    setClickTimeout(timeout);

    if (clickCount === 1) {
      handleOpenModal(wallpaper);
      setClickCount(0);
    }
  }, [clickCount, clickTimeout, handleOpenModal, loadedImages]);

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
          className="bg-[#F7F06D] text-black px-4 py-2 rounded-full hover:bg-[#F7F06D]/90 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const breakpointColumnsObj = {
    default: 4,
    1400: 3,
    1100: 2,
    700: 1,
  }

  const ImageComponent = ({ wallpaper, index }: { wallpaper: Wallpaper; index: number }) => {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => observer.disconnect();
    }, []);

    if (error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <span className="text-white/50">Failed to load image</span>
        </div>
      );
    }

    return (
      <div ref={imageRef} className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        {isVisible && (
          <Image
            src={wallpaper.preview_url}
            alt={wallpaper.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-all duration-500 group-hover:scale-[1.02] ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            priority={index < 6}
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLzYvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLz/2wBDAR0dHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eLz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            onLoad={() => {
              setIsLoading(false);
            }}
            onError={(e) => {
              console.error(`Failed to load image: ${wallpaper.preview_url}`, e);
              setError(true);
              setIsLoading(false);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-[90vw] mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {displayedWallpapers.map((wallpaper, index) => (
          <div key={wallpaper.sha} className="mb-4 sm:mb-6">
            <div
              className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/5"
              onClick={(e) => handleClick(wallpaper, e)}
            >
              <ImageComponent wallpaper={wallpaper} index={index} />
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
                      onClick={() => toggleWallpaperSelection(wallpaper.sha)}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.sha)
                          ? "bg-[#F7F06D] text-black"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all hover:scale-105`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(wallpaper.sha)}
                      className={`p-2 rounded-full ${
                        favorites.includes(wallpaper.sha)
                          ? "bg-[#F7F06D] text-black"
                          : "bg-black/60 text-white hover:bg-black/70"
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
          </div>
        ))}
      </Masonry>

      {selectedWallpapers.length > 0 && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={downloadSelectedWallpapers}
            className="bg-[#F7F06D]/10 text-[#F7F06D] px-5 py-2.5 rounded-full hover:bg-[#F7F06D]/15 transition-all text-[13px] font-medium flex items-center gap-2 animate-bounce backdrop-blur-lg"
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
            className={`px-3 py-1 rounded-full text-xs ${filter === "all" ? "bg-[#F7F06D] text-black" : "text-white"}`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("desktop")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "desktop" ? "bg-[#F7F06D] text-black" : "text-white"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => handleFilterChange("mobile")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "mobile" ? "bg-[#F7F06D] text-black" : "text-white"
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

function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
    isDownload?: boolean
  },
) {
  const transformations = options.isDownload ? [] : ["f_auto", "q_auto"]

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transformationString = transformations.join(",")

  if (options.isDownload) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
  } else {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`
  }
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

