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
  Trash2,
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
import { showSakugaToast } from "@/lib/toast"

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
  disableContainer?: boolean; // When true, does not re-wrap in max-w / mx-auto / px container
  onShareFavorites?: () => void; // Optional handler to open share modal from favorites toolbar
  hideBottomFilter?: boolean; // When true, hides the fixed bottom filter pill
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

export default function WallpaperGrid({
  wallpapers: favoriteIds,
  categoryFilter,
  color: colorFilter,
  disableContainer = false,
  onShareFavorites,
  hideBottomFilter = false,
}: WallpaperGridProps) {
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
    showSakugaToast(message)
  }, [])

  const handleDownloadAllFavorites = useCallback(async () => {
    if (isDownloading) return
    const allFavorites = getFilteredWallpapers()
    if (allFavorites.length === 0) {
      showNotification("No favorites to download")
      return
    }
    activeDownloadsRef.current += 1
    setIsDownloading(true)
    showNotification(`Downloading ${allFavorites.length} favorite${allFavorites.length === 1 ? '' : 's'}...`)
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
  }, [getFilteredWallpapers, isDownloading, showNotification])

  const handleClearAllFavorites = useCallback(() => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to remove all saved favorites?")) {
      clearAllFavorites()
      showNotification("Removed all favorites")
    }
  }, [clearAllFavorites, showNotification])

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
    const cleanName = wallpaper.name.replace(/\.[^/.]+$/, "")
    showNotification(`Downloading ${cleanName}...`);

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
    let currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
    let list = filteredWallpapers;
    if (currentFilteredIndex === -1 && wallpapersState.length > 0) {
      list = wallpapersState;
      currentFilteredIndex = wallpapersState.findIndex(w => w.sha === selectedWallpaper?.sha);
    }

    if (currentFilteredIndex > 0) {
      const prevWallpaper = list[currentFilteredIndex - 1];
      setSelectedWallpaper(prevWallpaper);
      const fullIndex = wallpapersState.findIndex(w => w.sha === prevWallpaper.sha);
      setSelectedIndex(fullIndex);
    }
  }, [selectedWallpaper, getFilteredWallpapers, wallpapersState]);

  const handleNextWallpaper = useCallback(() => {
    const filteredWallpapers = getFilteredWallpapers();
    let currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
    let list = filteredWallpapers;
    if (currentFilteredIndex === -1 && wallpapersState.length > 0) {
      list = wallpapersState;
      currentFilteredIndex = wallpapersState.findIndex(w => w.sha === selectedWallpaper?.sha);
    }

    if (currentFilteredIndex >= 0 && currentFilteredIndex < list.length - 1) {
      const nextWallpaper = list[currentFilteredIndex + 1];
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
          className="bg-[#EDEDED] hover:bg-white text-black px-4 py-2 rounded-full transition-all flex items-center gap-2 mx-auto text-xs font-medium"
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
    <div className={disableContainer ? "w-full relative pb-24" : "w-full mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative max-w-[90%] md:max-w-[88%] xl:max-w-[85%]"}>
      {/* Desktop Controls Toolbar (Unified wrapped layout) */}
      {!favoriteIds && (
        <div className="hidden md:flex w-full items-center justify-between gap-4 mb-8">
          {/* Left: Categories (Wrap) */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8E8E8E] font-medium">
                Categories
              </span>
              {(selectedCategories.length > 0 || isPopular) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([])
                    setIsPopular(false)
                  }}
                  className="text-xs text-[#8E8E8E] hover:text-[#EDEDED] transition-colors px-1"
                >
                  Clear ({selectedCategories.length + (isPopular ? 1 : 0)})
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([])
                  setIsPopular(false)
                }}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-95 ${
                  selectedCategories.length === 0 && !isPopular
                    ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                    : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                }`}
              >
                All Wallpapers
              </button>
              
              {/* Popular Button (Desktop) */}
              <button
                type="button"
                onClick={() => {
                  setIsPopular((prev) => !prev)
                  setSelectedCategories([])
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 select-none cursor-pointer ${
                  isPopular
                    ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                    : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                }`}
                title="View popular wallpapers"
              >
                <Flame
                  className={`w-3.5 h-3.5 transition-colors ${
                    isPopular ? "text-black fill-current" : "text-[#8E8E8E]"
                  }`}
                />
                <span>Popular</span>
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
                        ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                        : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isSelected ? "text-black" : "text-[#8E8E8E]"}`} />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Layout Switcher */}
          {!categoryFilter && (
            <div className="flex flex-col gap-2.5 justify-end items-end">
              <span className="text-xs text-[#8E8E8E] font-medium">
                Layout
              </span>
              <div className="inline-flex items-center gap-0.5 bg-white/[0.04] rounded-full p-1 border border-white/[0.08]">
                <button
                  onClick={() => setLayoutMode("masonry")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    layoutMode === "masonry"
                      ? "bg-[#EDEDED] text-black shadow-xs"
                      : "text-[#8E8E8E] hover:text-[#EDEDED]"
                  }`}
                  title="Masonry layout"
                >
                  Masonry
                </button>
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    layoutMode === "grid"
                      ? "bg-[#EDEDED] text-black shadow-xs"
                      : "text-[#8E8E8E] hover:text-[#EDEDED]"
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
              <span className="text-xs text-[#8E8E8E] font-medium">
                Categories
              </span>
              {(selectedCategories.length > 0 || isPopular) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([])
                    setIsPopular(false)
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#8E8E8E] hover:text-[#EDEDED] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full transition-colors active:scale-95"
                  title="Clear category filters"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Reset</span>
                  <span className="opacity-75">
                    ({selectedCategories.length + (isPopular ? 1 : 0)})
                  </span>
                </button>
              )}
            </div>

            {/* Layout Toggle (Mobile) */}
            {!categoryFilter && (
              <div className="inline-flex items-center gap-0.5 bg-white/[0.04] rounded-full p-0.5 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setLayoutMode("masonry")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    layoutMode === "masonry"
                      ? "bg-[#EDEDED] text-black shadow-xs font-medium"
                      : "text-[#8E8E8E] hover:text-[#EDEDED]"
                  }`}
                >
                  Masonry
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    layoutMode === "grid"
                      ? "bg-[#EDEDED] text-black shadow-xs font-medium"
                      : "text-[#8E8E8E] hover:text-[#EDEDED]"
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
                    ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                    : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                }`}
              >
                All
              </button>

              {/* Popular Button (Mobile) */}
              <button
                type="button"
                onClick={() => {
                  setIsPopular((prev) => !prev)
                  setSelectedCategories([])
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 active:scale-95 select-none cursor-pointer ${
                  isPopular
                    ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                    : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                }`}
                title="View popular wallpapers"
              >
                <Flame
                  className={`w-3 h-3 transition-colors ${
                    isPopular ? "text-black fill-current" : "text-[#8E8E8E]"
                  }`}
                />
                <span>Popular</span>
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
                        ? "bg-[#EDEDED] text-black border-transparent shadow-xs"
                        : "bg-white/[0.04] text-[#8E8E8E] border-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED]"
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isSelected ? "text-black" : "text-[#8E8E8E]"}`} />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {favoriteIds && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
          {/* Left: Platform segmented switch */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
            {(["all", "desktop", "mobile"] as const).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                    isActive
                      ? "bg-[#EDEDED] text-black shadow-xs font-medium"
                      : "text-[#8E8E8E] hover:text-[#EDEDED]"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "desktop" ? "Desktop" : "Mobile"}
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onShareFavorites && (
              <button
                type="button"
                onClick={onShareFavorites}
                className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-[#EDEDED] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                title="Share your collection"
              >
                <Share2 className="w-3.5 h-3.5 text-white/70" />
                <span>Share</span>
              </button>
            )}

            <button
              type="button"
              disabled={isDownloading || displayedWallpapers.length === 0}
              onClick={handleDownloadAllFavorites}
              className="h-8 px-3.5 rounded-lg bg-[#EDEDED] hover:bg-white text-black text-xs font-medium transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
              title="Download all filtered favorites"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>{isDownloading ? "Downloading..." : "Download all"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllFavorites}
              className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 text-[#8E8E8E] hover:text-red-400 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              title="Remove all favorites"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        </div>
      )}

      {favoriteIds && displayedWallpapers.length === 0 && (
        <div className="py-16 text-center text-[#8E8E8E] text-xs">
          No {filter !== "all" ? filter : ""} favorites in your collection.
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
                          ? "bg-[#EDEDED] text-black"
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
                          ? "bg-black/60 text-rose-400"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '50ms', willChange: "transform" }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(wallpaper.sha) ? "fill-rose-400" : ""}`} />
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
                      <Download className="w-3 h-3 text-white/70" />
                      <span>{formatDownloadCount(downloadCount)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
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
                          ? "bg-[#EDEDED] text-black"
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
                          ? "bg-black/60 text-rose-400"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '50ms', willChange: "transform" }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(wallpaper.sha) ? "fill-rose-400" : ""}`} />
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
                      <Download className="w-3 h-3 text-white/70" />
                      <span>{formatDownloadCount(downloadCount)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
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
            className="bg-[#EDEDED] hover:bg-white text-black px-4 py-2 rounded-full transition-all text-xs font-medium flex items-center gap-2 shadow-2xl border border-white/20"
            style={{ width: "auto" }}
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Download selected ({selectedWallpapers.length})</span>
          </button>
        </div>
      )}

      {!favoriteIds && !hideBottomFilter && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 sm:px-6 lg:px-8 pointer-events-none z-50 flex justify-center md:justify-start">
          <div 
            className="pointer-events-auto relative flex bg-[#0A0A0A]/95 backdrop-blur-md rounded-full p-1 border border-white/[0.08] shadow-2xl h-10 items-center transition-all duration-300"
            style={{
              width: isMobileDevice ? "210px" : "260px"
            }}
          >
            {/* Sliding Indicator */}
            <div 
              className="absolute top-[4px] bottom-[4px] bg-[#EDEDED] rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-xs"
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
              className={`h-full rounded-full z-10 flex items-center justify-center text-xs transition-colors duration-200 ${
                filter === "all" ? "text-black font-medium" : "text-[#8E8E8E] hover:text-[#EDEDED]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange("desktop")}
              style={{
                width: isMobileDevice ? "67px" : "84px"
              }}
              className={`h-full rounded-full z-10 flex items-center justify-center text-xs transition-colors duration-200 ${
                filter === "desktop" ? "text-black font-medium" : "text-[#8E8E8E] hover:text-[#EDEDED]"
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => handleFilterChange("mobile")}
              style={{
                width: isMobileDevice ? "67px" : "84px"
              }}
              className={`h-full rounded-full z-10 flex items-center justify-center text-xs transition-colors duration-200 ${
                filter === "mobile" ? "text-black font-medium" : "text-[#8E8E8E] hover:text-[#EDEDED]"
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
      )}

      {selectedWallpaper && (() => {
        const filteredWallpapers = getFilteredWallpapers();
        let currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
        let listToUse = filteredWallpapers;
        if (currentFilteredIndex === -1 && wallpapersState.length > 0) {
          listToUse = wallpapersState;
          currentFilteredIndex = wallpapersState.findIndex(w => w.sha === selectedWallpaper?.sha);
        }
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
            hasNext={currentFilteredIndex >= 0 && currentFilteredIndex < listToUse.length - 1}
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