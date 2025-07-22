"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
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

const StableImageComponent = React.memo(({ wallpaper, index }: { wallpaper: Wallpaper; index: number }) => {
  const [error, setError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Use a stable ID to identify this specific image and prevent reloads
  const stableId = `image-${wallpaper.sha}`;
  
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
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
      <Image
        id={stableId}
        src={wallpaper.preview_url}
        alt={wallpaper.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover transition-all duration-500 group-hover:scale-[1.02] ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        priority={index < 6}
        quality={75}
        placeholder="blur"
        loading={index < 12 ? "eager" : "lazy"}
        onLoadingComplete={() => setIsImageLoaded(true)}
        onError={() => setError(true)}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALiAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLzYvLy8vLy8vLy8vLy8vLz/2wBDAR0dHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eHR4eLz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the wallpaper sha changes (which should never happen for the same card)
  return prevProps.wallpaper.sha === nextProps.wallpaper.sha;
});

StableImageComponent.displayName = 'StableImageComponent';

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
  const [showDownloadConfirmation, setShowDownloadConfirmation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState({ fileName: "", fileType: "" });

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
      : wallpapersState.filter(wallpaper => wallpaper.platform?.toLowerCase() === filter);

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
        
        // Filter by favorites if favoriteIds are provided
        if (favoriteIds && favoriteIds.length > 0) {
          wallpapers = wallpapers.filter(wallpaper => favoriteIds.includes(wallpaper.sha))
        }

        // Sort wallpapers by newest first
        wallpapers.sort((a: any, b: any) => b.uploadDate.getTime() - a.uploadDate.getTime())

        setWallpapersState(wallpapers)
        setDisplayedWallpapers(wallpapers.slice(0, initialLoadSize))
        setHasMore(wallpapers.length > initialLoadSize)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching wallpapers:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [categoryFilter, favoriteIds],
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
        (wallpaper) => wallpaper.platform?.toLowerCase() === newFilter
      );
      setDisplayedWallpapers(filteredWallpapers.slice(0, initialLoadSize));
    }
    setHasMore(true);
  }, [wallpapersState]);

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
    setIsDownloading(true);
    showNotification(`Your wallpapers are now downloading...`);
    
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
          
          // Extract file extension from the URL or Content-Type
          let fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || ''
          // Remove any query parameters from the extension
          fileExtension = fileExtension.split('?')[0]
          
          // If no extension or invalid extension, determine from MIME type or default to jpg
          if (!fileExtension || fileExtension.length > 4) {
            const contentType = response.headers.get('Content-Type') || ''
            if (contentType.includes('png')) {
              fileExtension = 'png'
            } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
              fileExtension = 'jpg'
            } else if (contentType.includes('webp')) {
              fileExtension = 'webp'
            } else {
              // Default to jpg for images
              fileExtension = 'jpg'
            }
          }
          
          // Ensure the filename has the correct extension
          const fileName = wallpaper.name.includes('.') ? 
            wallpaper.name : `${wallpaper.name}.${fileExtension}`
          
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          // Show download confirmation for first file only in popup
          if (selectedWallpapers.indexOf(sha) === 0) {
            setDownloadInfo({
              fileName: selectedWallpapers.length > 1 ? `${fileName} and ${selectedWallpapers.length - 1} more` : fileName,
              fileType: fileExtension.toUpperCase()
            });
            setShowDownloadConfirmation(true);
            
            // Hide the confirmation after 3 seconds
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
    
    // Reset after download completes
    setTimeout(() => {
      setIsDownloading(false);
      setSelectedWallpapers([]);
    }, 1000);
    
  }, [selectedWallpapers, wallpapersState, showNotification]);

  const handleDownload = useCallback(async (wallpaper: Wallpaper) => {
    setIsDownloading(true);
    showNotification("Your wallpaper is now downloading...");
    
    try {
      const response = await fetch(wallpaper.download_url)
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
    
      // Extract file extension from the URL or Content-Type
      let fileExtension = wallpaper.download_url.split('.').pop()?.toLowerCase() || ''
      // Remove any query parameters from the extension
      fileExtension = fileExtension.split('?')[0]
    
      // If no extension or invalid extension, determine from MIME type or default to jpg
      if (!fileExtension || fileExtension.length > 4) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('png')) {
          fileExtension = 'png'
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          fileExtension = 'jpg'
        } else if (contentType.includes('webp')) {
          fileExtension = 'webp'
        } else {
          // Default to jpg for images
          fileExtension = 'jpg'
        }
      }
    
      // Ensure the filename has the correct extension
      const fileName = wallpaper.name.includes('.') ? 
        wallpaper.name : `${wallpaper.name}.${fileExtension}`
    
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Show download confirmation popup with file details
      setDownloadInfo({
        fileName: fileName,
        fileType: fileExtension.toUpperCase()
      });
      setShowDownloadConfirmation(true);
      
      // Hide the confirmation after 3 seconds
      setTimeout(() => {
        setShowDownloadConfirmation(false);
        setIsDownloading(false);
      }, 3000);
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
      showNotification("Failed to download wallpaper")
      setIsDownloading(false);
    }
  }, [showNotification])

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchWallpapers({ sortBy: "newest" });
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
    // Get the filtered wallpapers based on current filter
    const filteredWallpapers = filter === "all" 
      ? wallpapersState 
      : wallpapersState.filter(wallpaper => wallpaper.platform?.toLowerCase() === filter);
    
    // Find current wallpaper index in filtered list
    const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
    
    if (currentFilteredIndex > 0) {
      const prevWallpaper = filteredWallpapers[currentFilteredIndex - 1];
      setSelectedWallpaper(prevWallpaper);
      // Update the selected index to match the position in the full wallpapers array
      const fullIndex = wallpapersState.findIndex(w => w.sha === prevWallpaper.sha);
      setSelectedIndex(fullIndex);
    }
  }, [selectedWallpaper, filter, wallpapersState]);

  const handleNextWallpaper = useCallback(() => {
    // Get the filtered wallpapers based on current filter
    const filteredWallpapers = filter === "all" 
      ? wallpapersState 
      : wallpapersState.filter(wallpaper => wallpaper.platform?.toLowerCase() === filter);
    
    // Find current wallpaper index in filtered list
    const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
    
    if (currentFilteredIndex < filteredWallpapers.length - 1) {
      const nextWallpaper = filteredWallpapers[currentFilteredIndex + 1];
      setSelectedWallpaper(nextWallpaper);
      // Update the selected index to match the position in the full wallpapers array
      const fullIndex = wallpapersState.findIndex(w => w.sha === nextWallpaper.sha);
      setSelectedIndex(fullIndex);
    }
  }, [selectedWallpaper, filter, wallpapersState]);

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

  // Replace the original ImageComponent with the stable one
  const ImageComponent = StableImageComponent;

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
        {displayedWallpapers.map((wallpaper, index) => {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          
          return (
            <div 
              key={wallpaper.sha} 
              className={`${favoriteIds ? 'mb-3 sm:mb-4' : 'mb-4 sm:mb-6'}`}
              style={{
                animationDelay: `${isMobile ? index * 10 : index * 50}ms`, // Further reduced delay for mobile
                animation: `${isMobile ? 'fadeInUpMobile' : 'fadeInUp'} ${isMobile ? '0.2s' : '0.6s'} ease-out both`
              }}
            >
              <div
                className={`group relative ${favoriteIds ? 'aspect-[4/3]' : 'aspect-[3/2]'} overflow-hidden rounded-2xl bg-white/5 transition-all ${isMobile ? 'duration-300' : 'duration-500'} hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30`}
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
                    <h3 className="text-[15px] font-medium text-white/90 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
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
                        favorites.includes(wallpaper.sha)
                          ? "bg-black/60 text-[#FF0000]"
                          : "bg-black/60 text-white hover:bg-black/70"
                      } backdrop-blur-sm transition-all duration-300 hover:scale-105 transform translate-y-2 group-hover:translate-y-0 z-10`}
                      style={{ transitionDelay: isMobile ? '0ms' : '50ms', willChange: "transform" }}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(wallpaper.sha) ? "fill-[#FF0000]" : ""}`} />
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
                
                {/* Simplified badges with shorter animations */}
                <div className="absolute top-3 left-3 bg-[var(--accent-light)] text-black px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:shadow-lg"
                     style={{ willChange: "transform" }}>
                  {wallpaper.resolution}
                </div>
                <div className="absolute top-3 right-3 bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 group-hover:bg-white/20"
                     style={{ willChange: "transform" }}>
                  {wallpaper.tag}
                </div>
                
                {/* Simplified highlight border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 group-hover:border-white/20 pointer-events-none"></div>
              </div>
            </div>
          );
        })}
      </Masonry>

      {/* Only show download button if not currently downloading */}
      {selectedWallpapers.length > 0 && !isDownloading && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50">
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

      {selectedWallpaper && (() => {
        const filteredWallpapers = filter === "all" 
          ? wallpapersState 
          : wallpapersState.filter(wallpaper => wallpaper.platform?.toLowerCase() === filter);
        const currentFilteredIndex = filteredWallpapers.findIndex(w => w.sha === selectedWallpaper?.sha);
        
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
            onPrevious={handlePreviousWallpaper}
            onNext={handleNextWallpaper}
            hasPrevious={currentFilteredIndex > 0}
            hasNext={currentFilteredIndex < filteredWallpapers.length - 1}
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