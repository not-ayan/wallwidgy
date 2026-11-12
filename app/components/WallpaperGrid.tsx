"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Download,
  Heart,
  Expand,
  RefreshCw,
  Share2,
  Leaf,
  Film,
  Building,
  Palette,
  Car,
  Sparkles,
  Cpu,
  Moon,
  Atom,
  Flame,
  X,
} from "lucide-react"
import WallpaperModal from "./WallpaperModal"
import Masonry from "react-masonry-css"
import { useFavorites } from "@/hooks/use-favorites"
import { getParsedWallpapers } from "@/lib/wallpaper-store"
import { trackDownload } from "@/lib/analytics"
import {
  appendPaginationSlice,
  buildDownloadCountMap,
  createLatestRequestGuard,
  filterWallpapersList,
  getWallpaperDownloadCount,
  getDisplayDownloadCount,
  formatDownloadCount,
} from "@/lib/ui-state-helpers"

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
  category?: string;
  colors?: string[];
}

interface WallpaperGridProps {
  wallpapers?: string[]; // Array of favorite wallpaper IDs
  categoryFilter?: string; // Category filter string
  color?: string; // Color filter string
}

const CATEGORY_LIST = [
  { id: "abstract", name: "Abstract", icon: Atom },
  { id: "anime", name: "Anime", icon: Film },
  { id: "architecture", name: "Architecture", icon: Building },
  { id: "art", name: "Art", icon: Palette },
  { id: "cars", name: "Cars", icon: Car },
  { id: "minimal", name: "Minimal", icon: Sparkles },
  { id: "nature", name: "Nature", icon: Leaf },
  { id: "tech", name: "Tech", icon: Cpu },
  { id: "amoled", name: "AMOLED", icon: Moon },
]

interface ImageDimensions {
  width: number;
  height: number;
}

const getResolvedDownloadCount = (
  wallpaper: { sha: string; name: string },
  counts?: Map<string, number>,
  index?: number
): number => {
  if (typeof getDisplayDownloadCount === 'function') {
    return getDisplayDownloadCount(wallpaper, counts, index)
  }
  return 0
}

const StableImageComponent = React.memo(({ wallpaper, index }: { wallpaper: Wallpaper; index: number }) => {
  const [error, setError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Use a stable ID to identify this specific image and prevent reloads
  const stableId = `image-${wallpaper.sha}`;

  // Custom error handler: if load fails, show error
  const handleImageError = useCallback(() => {
    setError(true);
  }, []);

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
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        className={`object-cover will-change-transform ${isImageLoaded ? 'opacity-100 transition-opacity' : 'opacity-0'} ${!isMobile ? 'group-hover:scale-[1.02] transition-transform duration-300' : ''}`}
        priority={index < 4}
        quality={isMobile ? 65 : 75}
        loading={index < 8 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsImageLoaded(true)}
        onError={handleImageError}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALiAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLzYvLy8vLy8vLy8vLy8vLz/2wBDAR0dHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eLz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        unoptimized={true}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the wallpaper sha changes
  return prevProps.wallpaper.sha === nextProps.wallpaper.sha;
});

StableImageComponent.displayName = 'StableImageComponent';

export default function WallpaperGrid({ wallpapers: favoriteIds, categoryFilter, color: colorFilter }: WallpaperGridProps) {
  const [wallpapersState, setWallpapersState] = useState<Wallpaper[]>([])
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([])
  const { favorites, toggleFavorite, isFavorite, isLoading: favoritesLoading, clearAllFavorites } = useFavorites()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [filter, setFilter] = useState<"all" | "desktop" | "mobile">("all")
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [availableColors, setAvailableColors] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [displayedWallpapers, setDisplayedWallpapers] = useState<Wallpaper[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const initialLoadSize = 40
  const loadMoreSize = 20
  const [showDownloadConfirmation, setShowDownloadConfirmation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const activeDownloadsRef = useRef(0);
  const fetchGuardRef = useRef(createLatestRequestGuard());
  const [downloadInfo, setDownloadInfo] = useState({ fileName: "", fileType: "" });
  const [layoutMode, setLayoutMode] = useState<"masonry" | "grid">("masonry");
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const [isPopular, setIsPopular] = useState(categoryFilter === 'popular')
  const [popularDownloadCounts, setPopularDownloadCounts] = useState<Map<string, number>>(new Map())
  const hasFetchedPopularRef = useRef(false)

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryFilter && categoryFilter !== 'popular' ? [categoryFilter] : []
  )

  useEffect(() => {
    if (categoryFilter) {
      if (categoryFilter === 'popular') {
        setIsPopular(true)
        setSelectedCategories([])
      } else {
        setIsPopular(false)
        setSelectedCategories([categoryFilter])
      }
    }
  }, [categoryFilter])

  // Fetch popular downloads from D1 when Popular tab is activated (or initially if active)
  useEffect(() => {
    if (isPopular && !hasFetchedPopularRef.current) {
      hasFetchedPopularRef.current = true
      fetch('/api/downloads?limit=100')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.wallpapers)) {
            setPopularDownloadCounts(buildDownloadCountMap(data.wallpapers))
          }
        })
        .catch((err) => {
          console.warn('Failed to load popular downloads:', err)
        })
    }
  }, [isPopular])

  const getFilteredWallpapers = useCallback(() => {
    return filterWallpapersList(wallpapersState, {
      favoriteIds,
      platformFilter: filter,
      selectedCategories,
      colorFilter,
      sortByPopular: isPopular,
      downloadCounts: popularDownloadCounts,
    });
  }, [wallpapersState, filter, selectedCategories, colorFilter, favoriteIds, isPopular, popularDownloadCounts]);

  useEffect(() => {
    const filtered = getFilteredWallpapers();
    setDisplayedWallpapers(filtered.slice(0, initialLoadSize));
    setHasMore(filtered.length > initialLoadSize);
  }, [selectedCategories, filter, wallpapersState, getFilteredWallpapers, isPopular]);

  useEffect(() => {
    const filtered = getFilteredWallpapers();
    setHasMore(displayedWallpapers.length < filtered.length);
  }, [displayedWallpapers.length, getFilteredWallpapers]);

  // Auto-select layout based on device type
  useEffect(() => {
    const checkDeviceType = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobileDevice(isMobile);
      setLayoutMode(isMobile ? "grid" : "masonry");
    };

    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  // Define this function higher up in the component
  const toggleWallpaperSelection = useCallback((sha: string) => {
    setSelectedWallpapers((prev) => {
      if (prev.includes(sha)) {
        return prev.filter((s) => s !== sha)
      } else {
        return [...prev, sha]
      }
    })
  }, [])

  // Load more wallpapers after initial load
  const loadMoreWallpapers = useCallback(() => {
    if (isLoading || !hasMore) return;

    const filteredWallpapers = getFilteredWallpapers();

    setDisplayedWallpapers((prev) => {
      const { next } = appendPaginationSlice(prev, filteredWallpapers, loadMoreSize);
      return next;
    });
  }, [getFilteredWallpapers, isLoading, hasMore, loadMoreSize]);

  // Update the useEffect for loading more wallpapers
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreWallpapers();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMoreWallpapers]);

  const fetchAvailableColors = useCallback(async () => {
    // Consolidated into fetchWallpapers client-side
  }, [])

  const fetchWallpapers = useCallback(
    async () => {
      const requestId = fetchGuardRef.current.next()
      try {
        setIsLoading(true)
        setError(null)

        const { wallpapers, availableColors } = await getParsedWallpapers()
        if (!fetchGuardRef.current.isCurrent(requestId)) return

        setAvailableColors(availableColors)

        let filteredWallpapers = wallpapers
        // Apply category filter prop if provided
        if (categoryFilter) {
          filteredWallpapers = filteredWallpapers.filter(wallpaper => wallpaper.category === categoryFilter)
        }

        setWallpapersState(filteredWallpapers)
      } catch (err: any) {
        if (!fetchGuardRef.current.isCurrent(requestId)) return
        setError(err?.message || "Failed to load wallpapers")
        console.error("Error fetching wallpapers:", err)
      } finally {
        if (fetchGuardRef.current.isCurrent(requestId)) {
          setIsLoading(false)
        }
      }
    },
    [categoryFilter],
  )

  useEffect(() => {
    fetchWallpapers()
  }, [fetchWallpapers])

  const handleFavorite = (wallpaper: Wallpaper) => {
    toggleFavorite(wallpaper.sha)
  };

  const handleFilterChange = useCallback((newFilter: "all" | "desktop" | "mobile") => {
    setFilter(newFilter);
    // Auto-switch to masonry layout when mobile filter is selected
    if (newFilter === "mobile") {
      setLayoutMode("masonry");
    } else {
      // Revert to the default layout for the device type when switching back
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setLayoutMode(isMobile ? "grid" : "masonry");
    }
  }, []);

  const showNotification = useCallback((message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-5 py-3 rounded-xl text-sm z-50 flex items-center gap-2 shadow-lg"
    
    // Add download icon for download notifications
    if (message.includes("downloading") || message.includes("Download")) {
      const iconSpan = document.createElement("span")
      iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
      notification.prepend(iconSpan)
    }
    
    const textSpan = document.createElement("span")
    textSpan.textContent = message
    notification.appendChild(textSpan)
    
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }, [])

  const downloadSelectedWallpapers = useCallback(async () => {
    if (selectedWallpapers.length === 0) return;
    activeDownloadsRef.current += 1;
    setIsDownloading(true);
    showNotification(`Your wallpapers are now downloading...`);

    try {
      for (const sha of selectedWallpapers) {
        const wallpaper = wallpapersState.find((w) => w.sha === sha)
        if (wallpaper) {
          try {
            trackDownload(wallpaper)
            setPopularDownloadCounts((prev) => {
              const next = new Map(prev)
              const count = getWallpaperDownloadCount(wallpaper, next) + 1
              next.set(wallpaper.sha, count)
              if (wallpaper.name) next.set(wallpaper.name, count)
              return next
            })
            const response = await fetch(wallpaper.download_url)
            if (!response.ok) throw new Error('Failed to download')
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url

            // Extract file extension from the URL or Content-Type
            let fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || ''
            fileExtension = fileExtension.split('?')[0]

            if (!fileExtension || fileExtension.length > 4) {
              const contentType = response.headers.get('Content-Type') || ''
              if (contentType.includes('png')) {
                fileExtension = 'png'
              } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                fileExtension = 'jpg'
              } else if (contentType.includes('webp')) {
                fileExtension = 'webp'
              } else {
                fileExtension = 'jpg'
              }
            }

            const fileName = wallpaper.name.includes('.') ?
              wallpaper.name : `${wallpaper.name}.${fileExtension}`

            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            if (selectedWallpapers.indexOf(sha) === 0) {
              setDownloadInfo({
                fileName: selectedWallpapers.length > 1 ? `${fileName} and ${selectedWallpapers.length - 1} more` : fileName,
                fileType: fileExtension.toUpperCase()
              });
              setShowDownloadConfirmation(true);
              setTimeout(() => {
                setShowDownloadConfirmation(false);
              }, 3000);
            }
          } catch (error) {
            console.error(`Error downloading ${wallpaper.name}:`, error)
            showNotification(`Failed to download ${wallpaper.name}`)
          }
        }
      }
      setSelectedWallpapers([]);
    } finally {
      activeDownloadsRef.current = Math.max(0, activeDownloadsRef.current - 1);
      setIsDownloading(activeDownloadsRef.current > 0);
    }
  }, [selectedWallpapers, wallpapersState, showNotification]);

  const handleDownload = useCallback(async (wallpaper: Wallpaper) => {
    activeDownloadsRef.current += 1;
    setIsDownloading(true);
    showNotification("Your wallpaper is now downloading...");

    try {
      trackDownload(wallpaper)
      setPopularDownloadCounts((prev) => {
        const next = new Map(prev)
        const count = getWallpaperDownloadCount(wallpaper, next) + 1
        next.set(wallpaper.sha, count)
        if (wallpaper.name) next.set(wallpaper.name, count)
        return next
      })
      const response = await fetch(wallpaper.download_url)
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      let fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || ''
      fileExtension = fileExtension.split('?')[0]

      if (!fileExtension || fileExtension.length > 4) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('png')) {
          fileExtension = 'png'
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          fileExtension = 'jpg'
        } else if (contentType.includes('webp')) {
          fileExtension = 'webp'
        } else {
          fileExtension = 'jpg'
        }
      }

      const fileName = wallpaper.name.includes('.') ?
        wallpaper.name : `${wallpaper.name}.${fileExtension}`

      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setDownloadInfo({
        fileName: fileName,
        fileType: fileExtension.toUpperCase()
      });
      setShowDownloadConfirmation(true);

      setTimeout(() => {
        setShowDownloadConfirmation(false);
      }, 3000);
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
      showNotification("Failed to download wallpaper")
    } finally {
      activeDownloadsRef.current = Math.max(0, activeDownloadsRef.current - 1);
      setIsDownloading(activeDownloadsRef.current > 0);
    }
  }, [showNotification])

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchWallpapers();
  }, [fetchWallpapers]);

  const handleShare = useCallback((wallpaper: Wallpaper) => {
    try {
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.sha)}`;
      
      if (navigator.share) {
        navigator.share({
          title: "Wallpaper",
          text: `Check out this wallpaper: ${wallpaper.name}`,
          url: shareUrl,
        }).catch(error => {
          console.error("Error sharing:", error);
          showNotification("Unable to share");
        });
      } else {
        navigator.clipboard.writeText(shareUrl)
          .then(() => showNotification("Link copied to clipboard!"))
          .catch(() => showNotification("Unable to copy link"));
      }
    } catch (error) {
      console.error("Error sharing:", error);
      showNotification("Unable to share or copy link");
    }
  }, [showNotification]);

  const handleOpenModal = useCallback((wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper);
    const index = wallpapersState.findIndex(w => w.sha === wallpaper.sha);
    setSelectedIndex(index);
  }, [wallpapersState]);

  const handleClick = useCallback((wallpaper: Wallpaper, isDoubleClick: boolean) => {
    if (isDoubleClick) {
      handleDownload(wallpaper);
    } else {
      handleOpenModal(wallpaper);
    }
  }, [handleDownload, handleOpenModal]);

  const handlePreviousWallpaper = useCallback(() => {
    const filteredWallpapers = getFilteredWallpapers();
    const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);

    if (currentFilteredIndex > 0) {
      const prevWallpaper = filteredWallpapers[currentFilteredIndex - 1];
      setSelectedWallpaper(prevWallpaper);
      const fullIndex = wallpapersState.findIndex(w => w.sha === prevWallpaper.sha);
      setSelectedIndex(fullIndex);
    }
  }, [selectedWallpaper, getFilteredWallpapers, wallpapersState]);

  const handleNextWallpaper = useCallback(() => {
    const filteredWallpapers = getFilteredWallpapers();
    const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);

    if (currentFilteredIndex >= 0 && currentFilteredIndex < filteredWallpapers.length - 1) {
      const nextWallpaper = filteredWallpapers[currentFilteredIndex + 1];
      setSelectedWallpaper(nextWallpaper);
      const fullIndex = wallpapersState.findIndex(w => w.sha === nextWallpaper.sha);
      setSelectedIndex(fullIndex);
    }
  }, [selectedWallpaper, getFilteredWallpapers, wallpapersState]);

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

  const breakpointColumnsObj: { [key: string]: number } = categoryFilter ? {
    default: 3,
    '1100': 2,
    '700': 1
  } : {
    default: 4,
    '1400': 3,
    '1100': 2,
    '700': 1
  }

  // Replace the original ImageComponent with the stable one
  const ImageComponent = StableImageComponent;

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative max-w-[90%] md:max-w-[88%] xl:max-w-[85%]">
      {/* Desktop Controls Toolbar (Unified wrapped layout) */}
      {!favoriteIds && (
        <div className="hidden md:flex w-full items-center justify-between gap-4 mb-8">
          {/* Left: Categories (Wrap) */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
                Filter by Categories
              </span>
              {(selectedCategories.length > 0 || isPopular) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([])
                    setIsPopular(false)
                  }}
                  className="font-mono text-[9px] text-[#F7F06D] hover:underline uppercase transition-all px-1"
                >
                  Clear ({selectedCategories.length + (isPopular ? 1 : 0)})
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([])
                  setIsPopular(false)
                }}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-95 ${
                  selectedCategories.length === 0 && !isPopular
                    ? "bg-[var(--accent-light)] text-black border-[var(--accent-light)] shadow-lg shadow-[var(--accent-light)]/10"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                All Wallpapers
              </button>
              
              {/* Refined Accent Glow Popular Button (Desktop) */}
              <button
                type="button"
                onClick={() => {
                  setIsPopular((prev) => !prev)
                  setSelectedCategories([])
                }}
                className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 select-none cursor-pointer ${
                  isPopular
                    ? "bg-[#141414] text-white border border-[var(--accent-light)]/45 shadow-[0_0_12px_rgba(255,248,207,0.16)]"
                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white hover:border-[var(--accent-light)]/25 hover:shadow-[0_0_8px_rgba(255,248,207,0.1)]"
                }`}
                title="View popular wallpapers"
              >
                {/* Subtle organic top sheen inside the pill (no rectangles or harsh lines) */}
                {isPopular && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_75%_45%_at_50%_0%,rgba(255,248,207,0.12),transparent_70%)]"
                  />
                )}

                <Flame
                  className={`w-3.5 h-3.5 transition-colors relative z-10 ${
                    isPopular
                      ? "text-[var(--accent-light)] fill-[var(--accent-light)]/25 drop-shadow-[0_0_5px_rgba(255,248,207,0.5)]"
                      : "text-[var(--accent-light)]/50 group-hover:text-[var(--accent-light)]"
                  }`}
                />
                <span className="relative z-10">Popular</span>
              </button>

              {CATEGORY_LIST.map((category) => {
                const categoryTag = `#${category.id}`
                const isSelected = selectedCategories.includes(categoryTag)
                const Icon = category.icon
                
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setIsPopular(false)
                      setSelectedCategories((prev) => {
                        if (prev.includes(categoryTag)) {
                          return prev.filter((t) => t !== categoryTag)
                        } else {
                          return [...prev, categoryTag]
                        }
                      })
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-[var(--accent-light)] text-black border-[var(--accent-light)] shadow-lg shadow-[var(--accent-light)]/10"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Layout Switcher */}
          {!categoryFilter && (
            <div className="flex flex-col gap-3 justify-end items-end">
              <span className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
                Layout
              </span>
              <div className="inline-flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setLayoutMode("masonry")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    layoutMode === "masonry"
                      ? "bg-[var(--accent-light)] text-black font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                  title="Masonry layout"
                >
                  Masonry
                </button>
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    layoutMode === "grid"
                      ? "bg-[var(--accent-light)] text-black font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                  title="Grid layout"
                >
                  Grid
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Controls Toolbar (Refined Mobile App Style) */}
      {!favoriteIds && (
        <div className="flex md:hidden flex-col gap-2.5 w-full mb-6 scroll-mt-28" id="categories-bar">
          {/* Subheader: Categories status vs Layout switcher */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/40 tracking-wider uppercase">
                Categories
              </span>
              {(selectedCategories.length > 0 || isPopular) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([])
                    setIsPopular(false)
                  }}
                  className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--accent-light)] hover:text-white bg-[var(--accent-light)]/10 hover:bg-[var(--accent-light)]/20 border border-[var(--accent-light)]/25 px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200 active:scale-95"
                  title="Clear category filters"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Reset</span>
                  <span className="opacity-75 font-semibold">
                    ({selectedCategories.length + (isPopular ? 1 : 0)})
                  </span>
                </button>
              )}
            </div>

            {/* Layout Toggle (Mobile) */}
            {!categoryFilter && (
              <div className="inline-flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setLayoutMode("masonry")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    layoutMode === "masonry"
                      ? "bg-[var(--accent-light)] text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Masonry
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    layoutMode === "grid"
                      ? "bg-[var(--accent-light)] text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Grid
                </button>
              </div>
            )}
          </div>

          {/* Categories Horizontal Carousel */}
          <div className="relative min-w-0 w-full">
            <div
              className="overflow-x-auto scrollbar-none py-1.5 -mx-4 px-4 flex items-center gap-1.5"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([])
                  setIsPopular(false)
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-200 active:scale-95 ${
                  selectedCategories.length === 0 && !isPopular
                    ? "bg-[var(--accent-light)] text-black border-[var(--accent-light)] shadow-sm"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                All
              </button>

              {/* Refined Accent Glow Popular Button (Mobile) */}
              <button
                type="button"
                onClick={() => {
                  setIsPopular((prev) => !prev)
                  setSelectedCategories([])
                }}
                className={`group relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 active:scale-95 select-none cursor-pointer ${
                  isPopular
                    ? "bg-[#141414] text-white border border-[var(--accent-light)]/45 shadow-[0_0_12px_rgba(255,248,207,0.16)]"
                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white hover:border-[var(--accent-light)]/25 hover:shadow-[0_0_8px_rgba(255,248,207,0.1)]"
                }`}
                title="View popular wallpapers"
              >
                {/* Subtle organic top sheen inside the pill (no rectangles or harsh lines) */}
                {isPopular && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_75%_45%_at_50%_0%,rgba(255,248,207,0.12),transparent_70%)]"
                  />
                )}

                <Flame
                  className={`w-3 h-3 transition-colors relative z-10 ${
                    isPopular
                      ? "text-[var(--accent-light)] fill-[var(--accent-light)]/25 drop-shadow-[0_0_5px_rgba(255,248,207,0.5)]"
                      : "text-[var(--accent-light)]/50 group-hover:text-[var(--accent-light)]"
                  }`}
                />
                <span className="relative z-10">Popular</span>
              </button>
              
              {CATEGORY_LIST.map((category) => {
                const categoryTag = `#${category.id}`
                const isSelected = selectedCategories.includes(categoryTag)
                const Icon = category.icon
                
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setIsPopular(false)
                      setSelectedCategories((prev) => {
                        if (prev.includes(categoryTag)) {
                          return prev.filter((t) => t !== categoryTag)
                        } else {
                          return [...prev, categoryTag]
                        }
                      })
                    }}
                    className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-[var(--accent-light)] text-black border-[var(--accent-light)] shadow-sm font-semibold"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Subtle Right Edge Fade Mask to signal scrollability without cutting chips */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10"
            />
          </div>
        </div>
      )}

      {favoriteIds && displayedWallpapers.length > 0 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
            disabled={isDownloading}
            onClick={async () => {
              if (isDownloading) return
              activeDownloadsRef.current += 1
              setIsDownloading(true)
              const allFavorites = getFilteredWallpapers()
              showNotification("Started downloading all favorites")
              try {
                for (const wallpaper of allFavorites) {
                  try {
                    trackDownload(wallpaper)
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
              } finally {
                activeDownloadsRef.current = Math.max(0, activeDownloadsRef.current - 1)
                setIsDownloading(activeDownloadsRef.current > 0)
              }
            }}
            className="bg-[var(--accent-light)] text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[var(--accent-light)]/90 transition-all text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Download All
          </button>
          <button
            onClick={() => {
              clearAllFavorites()
              showNotification("Removed all favorites")
            }}
            className="bg-black/60 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-black/70 transition-all text-xs sm:text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Remove All
          </button>
        </div>
      )}
      

      
      {layoutMode === "masonry" ? (
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {displayedWallpapers.map((wallpaper, index) => {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          // Use modulo to reset animation delay for each batch, preventing long delays
          const batchIndex = index % loadMoreSize;
          const isNewlyLoaded = index >= initialLoadSize;
          const downloadCount = isPopular
            ? getResolvedDownloadCount(wallpaper, popularDownloadCounts, index)
            : 0;
          
          return (
            <div 
              key={wallpaper.sha} 
              className="mb-4 sm:mb-6"
              style={{
                animationName: isMobile ? 'fadeInUpMobile' : 'fadeInUp',
                animationDuration: isMobile ? '0.2s' : '0.4s',
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                animationFillMode: 'both',
                animationDelay: isNewlyLoaded ? `${isMobile ? batchIndex * 5 : batchIndex * 20}ms` : `${isMobile ? index * 10 : index * 30}ms`
              }}
            >
              <div
                className={`group relative ${
                  wallpaper.platform === "Mobile"
                    ? 'aspect-[9/16]' 
                    : 'aspect-[3/2]'
                } overflow-hidden rounded-2xl bg-white/5 transition-all ${isMobile ? 'duration-300' : 'duration-500'} hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30`}
              >
                <ImageComponent wallpaper={wallpaper} index={index} />
                
                {/* Enhanced gradient overlay with smoother transition */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)",
                    willChange: "opacity" // Hardware acceleration hint
                  }}
                />
                
                {/* Clickable area for modal - only active on desktop */}
                <div 
                  className="absolute inset-0 cursor-pointer hidden sm:block"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(wallpaper, false);
                  }}
                />
                
                {/* Content with enhanced animations - optimized for mobile */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 pointer-events-none"
                     style={{ willChange: "opacity, transform" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-medium text-white/90 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 truncate mr-2">
                      {wallpaper.name}
                    </h3>
                    {downloadCount > 0 && (
                      <span className="text-xs text-white/70 font-mono flex items-center gap-1 flex-shrink-0">
                        <Download className="w-3 h-3 text-[#F7F06D]" />
                        {formatDownloadCount(downloadCount)}
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons with simplified animation */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        toggleWallpaperSelection(wallpaper.sha);
                        return false;
                      }}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.sha)
                          ? "bg-[var(--accent-light)] text-black"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '0ms', willChange: "transform" }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleFavorite(wallpaper);
                        return false;
                      }}
                      className={`p-2 rounded-full ${
                        isFavorite(wallpaper.sha)
                          ? "bg-black/60 text-[#FF0000]"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '50ms', willChange: "transform" }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(wallpaper.sha) ? "fill-[#FF0000]" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleShare(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10"
                      style={{ transitionDelay: isMobile ? '0ms' : '100ms', willChange: "transform" }}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleOpenModal(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10"
                      style={{ transitionDelay: isMobile ? '0ms' : '150ms', willChange: "transform" }}
                    >
                      <Expand className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <div
                    className="bg-black/60 backdrop-blur-md text-white/90 border border-white/10 px-2.5 py-1 rounded-full text-xs font-mono font-medium shadow-sm transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:shadow-lg"
                    style={{ willChange: "transform" }}
                  >
                    {wallpaper.resolution}
                  </div>
                  {downloadCount > 0 && (
                    <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-white/90 border border-white/10 px-2 py-1 rounded-full text-xs font-mono shadow-sm">
                      <Download className="w-3 h-3 text-[#F7F06D]" />
                      <span>{formatDownloadCount(downloadCount)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {isPopular && index < 3 && (
                    <div className="bg-[#F7F06D] text-black px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider shadow-md">
                      #{index + 1}
                    </div>
                  )}
                  <div
                    className="bg-white/10 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:bg-white/20"
                    style={{ willChange: "transform" }}
                  >
                    {wallpaper.tag}
                  </div>
                </div>
                
                {/* Simplified highlight border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 group-hover:border-white/20 pointer-events-none"></div>
              </div>
            </div>
          );
        })}
      </Masonry>
      ) : (
      <div className={`grid gap-4 sm:gap-6 ${
        filter === "mobile"
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
      }`}>
        {displayedWallpapers.map((wallpaper, index) => {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          // Use modulo to reset animation delay for each batch, preventing long delays
          const batchIndex = index % loadMoreSize;
          const isNewlyLoaded = index >= initialLoadSize;
          const downloadCount = isPopular
            ? getResolvedDownloadCount(wallpaper, popularDownloadCounts, index)
            : 0;
          
          return (
            <div 
              key={wallpaper.sha}
              style={{
                animationName: isMobile ? 'fadeInUpMobile' : 'fadeInUp',
                animationDuration: isMobile ? '0.2s' : '0.4s',
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                animationFillMode: 'both',
                animationDelay: isNewlyLoaded ? `${isMobile ? batchIndex * 5 : batchIndex * 20}ms` : `${isMobile ? index * 10 : index * 30}ms`
              }}
            >
              <div
                className={`group relative ${
                  filter === "mobile" 
                    ? 'aspect-[9/16]' 
                    : 'aspect-[3/2]'
                } overflow-hidden rounded-2xl bg-white/5 transition-all ${isMobile ? 'duration-300' : 'duration-500'} hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30`}
              >
                <ImageComponent wallpaper={wallpaper} index={index} />
                
                {/* Enhanced gradient overlay with smoother transition */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)",
                    willChange: "opacity"
                  }}
                />
                
                {/* Clickable area for modal - only active on desktop */}
                <div 
                  className="absolute inset-0 cursor-pointer hidden sm:block"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(wallpaper, false);
                  }}
                />
                
                {/* Content with enhanced animations - optimized for mobile */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 pointer-events-none"
                     style={{ willChange: "opacity, transform" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-medium text-white/90 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 truncate mr-2">
                      {wallpaper.name}
                    </h3>
                    {downloadCount > 0 && (
                      <span className="text-xs text-white/70 font-mono flex items-center gap-1 flex-shrink-0">
                        <Download className="w-3 h-3 text-[#F7F06D]" />
                        {formatDownloadCount(downloadCount)}
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons with simplified animation */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        toggleWallpaperSelection(wallpaper.sha);
                        return false;
                      }}
                      className={`p-2 rounded-full ${
                        selectedWallpapers.includes(wallpaper.sha)
                          ? "bg-[var(--accent-light)] text-black"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '0ms', willChange: "transform" }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleFavorite(wallpaper);
                        return false;
                      }}
                      className={`p-2 rounded-full ${
                        isFavorite(wallpaper.sha)
                          ? "bg-black/60 text-[#FF0000]"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '50ms', willChange: "transform" }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(wallpaper.sha) ? "fill-[#FF0000]" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleShare(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10"
                      style={{ transitionDelay: isMobile ? '0ms' : '100ms', willChange: "transform" }}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleOpenModal(wallpaper);
                      }}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10"
                      style={{ transitionDelay: isMobile ? '0ms' : '150ms', willChange: "transform" }}
                    >
                      <Expand className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <div
                    className="bg-black/60 backdrop-blur-md text-white/90 border border-white/10 px-2.5 py-1 rounded-full text-xs font-mono font-medium shadow-sm transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:shadow-lg"
                    style={{ willChange: "transform" }}
                  >
                    {wallpaper.resolution}
                  </div>
                  {downloadCount > 0 && (
                    <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-white/90 border border-white/10 px-2 py-1 rounded-full text-xs font-mono shadow-sm">
                      <Download className="w-3 h-3 text-[#F7F06D]" />
                      <span>{formatDownloadCount(downloadCount)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {isPopular && index < 3 && (
                    <div className="bg-[#F7F06D] text-black px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider shadow-md">
                      #{index + 1}
                    </div>
                  )}
                  <div
                    className="bg-white/10 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:bg-white/20"
                    style={{ willChange: "transform" }}
                  >
                    {wallpaper.tag}
                  </div>
                </div>
                
                {/* Simplified highlight border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 group-hover:border-white/20 pointer-events-none"></div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Only show download button if not currently downloading */}
      {selectedWallpapers.length > 0 && !isDownloading && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50"
          style={{
            bottom:
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? '80px' // Move slightly down on desktop (sm and above)
                : '80px', // Keep original on mobile
          }}
        >
          <button
            onClick={downloadSelectedWallpapers}
            className="bg-black/80 text-white px-5 py-2.5 rounded-full hover:bg-black/90 transition-all text-[13px] font-medium flex items-center gap-2 animate-bounce backdrop-blur-lg border border-white/10"
            style={{ width: "auto" }}
          >
            <Download className="w-4 h-4 text-[var(--accent-light)]" />
            Download Selected ({selectedWallpapers.length})
          </button>
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 sm:px-6 lg:px-8 pointer-events-none z-50 flex justify-center md:justify-start">
        <div 
          className="pointer-events-auto relative flex bg-[#0A0A0A] rounded-full p-1 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] h-10 items-center transition-all duration-300"
          style={{
            width: isMobileDevice ? "210px" : "260px"
          }}
        >
          {/* Sliding Indicator */}
          <div 
            className="absolute top-[4px] bottom-[4px] bg-[var(--accent-light)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: filter === "all" ? "4px" : filter === "desktop" ? (isMobileDevice ? "71px" : "88px") : (isMobileDevice ? "138px" : "172px"),
              width: isMobileDevice ? "67px" : "84px"
            }}
          />
          
          <button
            onClick={() => handleFilterChange("all")}
            style={{
              width: isMobileDevice ? "67px" : "84px"
            }}
            className={`h-full rounded-full z-10 flex items-center justify-center font-mono tracking-wider uppercase text-[10px] transition-colors duration-300 ${
              filter === "all" ? "text-black font-semibold" : "text-white/50 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("desktop")}
            style={{
              width: isMobileDevice ? "67px" : "84px"
            }}
            className={`h-full rounded-full z-10 flex items-center justify-center font-mono tracking-wider uppercase text-[10px] transition-colors duration-300 ${
              filter === "desktop" ? "text-black font-semibold" : "text-white/50 hover:text-white"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => handleFilterChange("mobile")}
            style={{
              width: isMobileDevice ? "67px" : "84px"
            }}
            className={`h-full rounded-full z-10 flex items-center justify-center font-mono tracking-wider uppercase text-[10px] transition-colors duration-300 ${
              filter === "mobile" ? "text-black font-semibold" : "text-white/50 hover:text-white"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {selectedWallpaper && (() => {
        const filteredWallpapers = getFilteredWallpapers();
        const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
        const modalDownloadCount = isPopular && currentFilteredIndex >= 0
          ? getResolvedDownloadCount(selectedWallpaper, popularDownloadCounts, currentFilteredIndex)
          : 0;
        
        return (
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
            downloadCount={modalDownloadCount}
            onPrevious={handlePreviousWallpaper}
            onNext={handleNextWallpaper}
            hasPrevious={currentFilteredIndex > 0}
            hasNext={currentFilteredIndex >= 0 && currentFilteredIndex < filteredWallpapers.length - 1}
          />
        );
      })()}

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

      {/* Add optimized animations for mobile */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUpMobile {
          from {
            opacity: 0;
            transform: translateY(10px); /* Reduced distance for faster visual effect */
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @media (max-width: 767px) {
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }
        }
        
        /* Force hardware acceleration for smoother animations */
        .group {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Optimize transitions for mobile */
        @media (max-width: 767px) {
          .group, .group * {
            transition-duration: 200ms !important; /* Faster transitions */
            animation-duration: 200ms !important; /* Faster animations */
          }
          
          .group-hover\:translate-y-0 {
            transform: translateY(0) !important;
          }
          
          /* Reduce or eliminate certain hover effects on mobile */
          .group:hover {
            transform: scale(1.01) !important;
          }
        }
      `}</style>
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