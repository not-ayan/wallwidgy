"use client"

import { useState, useEffect, useRef, useCallback } from "react"
// SmartImage: loads image unoptimized directly and shows error UI
function SmartImage({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  onLoad,
  onError,
  quality = 75,
  priority = false,
  sizes = '100vw',
  ...rest
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
  priority?: boolean;
  sizes?: string;
  [key: string]: any;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const handleImageError = useCallback(() => {
    setError(true);
    if (onError) onError();
  }, [onError]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
        <span className="text-white/60">Failed to load image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={handleImageError}
      quality={quality}
      priority={priority}
      sizes={sizes}
      unoptimized={true}
      {...rest}
    />
  );
}
import Image from "next/image"  // This is the Next.js Image component
import { Download, Share2, ChevronLeft, ChevronRight, X, Minus, Plus, Heart, Loader2, Images, Check, Maximize2 } from "lucide-react"
import Link from "next/link"
import SimilarWallpapers from "./SimilarWallpapers"
import { shouldDisableBlurEffects } from "@/lib/utils"
import { useBackHandler } from "@/hooks/use-back-handler"
import { useFavorites } from "@/hooks/use-favorites"
import { trackDownload } from "@/lib/analytics"
import { formatDownloadCount } from "@/lib/ui-state-helpers"
import type { SakugaButtonElement } from "@/types/sakuga"
import { showSakugaToast } from "@/lib/toast"

export interface Wallpaper {
  sha: string
  name: string
  download_url: string
  preview_url: string
  resolution: string
  platform: "Desktop" | "Mobile"
  width: number
  height: number
}

interface WallpaperModalProps {
  isOpen: boolean
  onClose: () => void
  wallpaper: Wallpaper
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  originalWallpaper?: Wallpaper // For tracking the original wallpaper when viewing recommendations
  onBackToOriginal?: () => void // For going back to the original wallpaper
  onSelectWallpaper?: (wallpaper: Wallpaper) => void // For handling recommended wallpaper selection
  downloadCount?: number // Only provided in popular mode
}

export default function WallpaperModal({
  isOpen,
  onClose,
  wallpaper: initialWallpaper,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  originalWallpaper,
  onBackToOriginal,
  onSelectWallpaper,
  downloadCount,
}: WallpaperModalProps) {
  // Use internal state to manage the current wallpaper and navigation history
  const [currentWallpaper, setCurrentWallpaper] = useState(initialWallpaper)
  const [history, setHistory] = useState<Wallpaper[]>([])
  const { isFavorite, toggleFavorite } = useFavorites()
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [isLoading, setIsLoading] = useState(true)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const downloadButtonRef = useRef<SakugaButtonElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isHighQuality, setIsHighQuality] = useState(false)
  const [isLoadingHighQuality, setIsLoadingHighQuality] = useState(false)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false)
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false)
  const [showSimilarWallpapers, setShowSimilarWallpapers] = useState(false)
  const [disableBlur, setDisableBlur] = useState(false)

  // Debounce the loading spinner to prevent instant black/loader flashes on quick cached switches
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (isImageLoading) {
      timer = setTimeout(() => setShowLoadingSpinner(true), 150)
    } else {
      setShowLoadingSpinner(false)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isImageLoading])

  // Navigate back through recommendation history or close modal
  const handleBack = useCallback(() => {
    if (history.length > 0) {
      const prevWallpaper = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      setCurrentWallpaper(prevWallpaper)
    } else if (onBackToOriginal) {
      onBackToOriginal()
    } else {
      onClose()
    }
  }, [history, onBackToOriginal, onClose])

  // Handle browser back button when modal is open
  useBackHandler({
    isActive: isOpen,
    onBack: () => {
      if (showSimilarWallpapers) {
        // If similar wallpapers tray is open, close it first
        setShowSimilarWallpapers(false)
      } else if (history.length > 0) {
        // Step back through recommendation history
        handleBack()
      } else {
        // Otherwise close the modal
        onClose()
      }
    },
    priority: 2 // Higher priority than basic modals
  })

  // Responsive viewport helpers
  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check if we should disable blur effects
    setDisableBlur(shouldDisableBlurEffects())
    
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  // Ensure Sakuga button and toast custom elements are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.customElements?.get('sakuga-button')) {
      const existing = document.querySelector('script[src="/button.js"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = '/button.js'
        document.head.appendChild(script)
      }
    }
    if (!window.customElements?.get('sakuga-toast')) {
      const existing = document.querySelector('script[src="/toast.js"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = '/toast.js'
        document.head.appendChild(script)
      }
    }
  }, [])

  // Sync with prop changes when parent navigates (e.g. Next/Prev from grid)
  useEffect(() => {
    setCurrentWallpaper(initialWallpaper)
    setHistory([])
  }, [initialWallpaper])

  useEffect(() => {
    if (currentWallpaper.resolution) {
      const [width, height] = currentWallpaper.resolution.split("x").map(Number)
      setAspectRatio(width / height)
    }
  }, [currentWallpaper.resolution])

  useEffect(() => {
    setIsLoading(true)
    setIsImageLoading(true)
    setIsImageLoaded(false)
    setIsPreviewLoaded(false)
    setIsFullImageLoaded(false)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsHighQuality(false)
    setIsLoadingHighQuality(false)
    setShowSimilarWallpapers(false) // Reset similar wallpapers tray when wallpaper changes
  }, [currentWallpaper.sha])

  // isMobile is now updated in the main updateViewport useEffect

  // Add focus management
  useEffect(() => {
    if (isOpen) {
      const currentModal = modalRef.current
      if (currentModal) {
        currentModal.focus()
      }
    }
  }, [isOpen])

  // Lock body scroll and prevent background layout shifts when modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isOpen])

  // Preload the high-resolution image when preview is loaded and seamlessly upgrade
  useEffect(() => {
    if (!isOpen || !currentWallpaper?.download_url || !isPreviewLoaded) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) {
        setIsFullImageLoaded(true);
        setIsHighQuality(true);
      }
    };
    img.src = currentWallpaper.download_url;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [isOpen, currentWallpaper, isPreviewLoaded]);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(currentWallpaper.sha)}`

      if (navigator.share) {
        await navigator.share({
          title: "Wallpaper",
          text: `Check out this wallpaper: ${currentWallpaper.name}`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        showNotification("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      showNotification("Unable to share or copy link")
    }
  }

  const showNotification = (message: string) => {
    showSakugaToast(message)
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      // Validate URL before attempting download
      if (!currentWallpaper.download_url) {
        showNotification("Download URL not available")
        return
      }

      // Record download count
      trackDownload(currentWallpaper)

      const response = await fetch(currentWallpaper.download_url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Extract file extension from the URL or Content-Type
      let fileExtension = currentWallpaper.download_url.split('.').pop()?.toLowerCase() || ''
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
      const fileName = currentWallpaper.name.includes('.') ? 
        // If filename already has an extension, use it as is
        currentWallpaper.name : 
        // Otherwise add the extension
        `${currentWallpaper.name}.${fileExtension}`
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      const cleanName = currentWallpaper.name.replace(/\.[^/.]+$/, "")
      showNotification(`Downloading ${cleanName}...`)
      setIsDownloaded(true)
      setTimeout(() => setIsDownloaded(false), 2000)
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
      console.error("Download URL was:", currentWallpaper.download_url)
      console.error("Full wallpaper object:", currentWallpaper)
      
      // Try to provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        showNotification("Network error - please check your connection")
      } else if (error instanceof Error) {
        showNotification(`Download failed: ${error.message}`)
      } else {
        showNotification("Failed to download wallpaper")
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsDragging(true)
      setStartPos({
        x: e.clientX,
        y: e.clientY,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1) {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const maxX = (containerRect.width * (zoom - 1)) / 2
      const maxY = (containerRect.height * (zoom - 1)) / 2

      // Calculate the difference from the start position
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      // Update position based on the difference
      const newX = position.x + deltaX
      const newY = position.y + deltaY

      // Constrain movement to prevent dragging beyond image bounds
      const constrainedX = Math.min(Math.max(newX, -maxX), maxX)
      const constrainedY = Math.min(Math.max(newY, -maxY), maxY)

      setPosition({ x: constrainedX, y: constrainedY })
      setStartPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsDragging(true)
      setStartPos({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1) {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const maxX = (containerRect.width * (zoom - 1)) / 2
      const maxY = (containerRect.height * (zoom - 1)) / 2

      // Calculate the difference from the start position
      const deltaX = e.touches[0].clientX - startPos.x
      const deltaY = e.touches[0].clientY - startPos.y

      // Update position based on the difference
      const newX = position.x + deltaX
      const newY = position.y + deltaY

      // Constrain movement to prevent dragging beyond image bounds
      const constrainedX = Math.min(Math.max(newX, -maxX), maxX)
      const constrainedY = Math.min(Math.max(newY, -maxY), maxY)

      setPosition({ x: constrainedX, y: constrainedY })
      setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1)
      setPosition({ x: 0, y: 0 })
      return newZoom
    })
  }

  // Drag detection for backdrop clicks to prevent accidental closes
  const dragDistanceRef = useRef(0)
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null)

  const handleBackdropPointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
    dragDistanceRef.current = 0
  }

  const handleBackdropPointerUp = (e: React.PointerEvent) => {
    if (pointerDownPosRef.current) {
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x)
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y)
      dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  // Update the background click handler
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // If the user dragged or panned more than 6px, do NOT close
    if (dragDistanceRef.current > 6) return
    // Only close if clicking directly on the background overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add click handler for the image container
  const handleImageContainerClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling up to background
    e.stopPropagation();
  };

  const loadHighQualityImage = () => {
    if (!currentWallpaper.download_url) {
      showNotification("Full resolution not available");
      return;
    }

    if (currentWallpaper.download_url === currentWallpaper.preview_url) {
      setIsHighQuality(true);
      setIsLoadingHighQuality(false);
      return;
    }

    setIsLoadingHighQuality(true);
    setIsHighQuality(true);
  }

  if (!isOpen) return null;

  const resolutionLabel = currentWallpaper.resolution
    ? formatResolution(currentWallpaper.resolution).replace(/\s*Portrait$/i, '')
    : null;

  return (
    <div
      ref={modalRef}
      id="wallpaper-modal"
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 ${disableBlur ? '' : 'backdrop-blur-sm'} outline-none`}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      onClick={handleBackgroundClick}
      onKeyDown={(e) => {
        switch (e.key) {
          case "Escape":
            onClose()
            break
          case "ArrowLeft":
            if (hasPrevious && onPrevious) onPrevious()
            break
          case "ArrowRight":
            if (hasNext && onNext) onNext()
            break
          case "ArrowUp":
            handleZoomIn()
            break
          case "ArrowDown":
            handleZoomOut()
            break
        }
      }}
    >
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 md:opacity-30 transition-all duration-500 pointer-events-none"
          style={{ 
            backgroundImage: `url(${currentWallpaper.preview_url})`,
            filter: disableBlur ? 'none' : 'blur(20px)',
          }} 
        />
        <div 
          className={`absolute inset-0 bg-black/70 ${disableBlur ? '' : 'backdrop-blur-2xl'} pointer-events-auto`}
          onPointerDown={handleBackdropPointerDown}
          onPointerUp={handleBackdropPointerUp}
          onClick={handleBackgroundClick}
        />
        <div 
          className="relative max-h-[100vh] md:max-h-[90vh] w-full md:w-auto md:max-w-[90vw] overflow-hidden md:rounded-2xl bg-transparent transition-all duration-300 ease-out pointer-events-auto"
          onClick={handleImageContainerClick}
        >
          {/* Image container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center overflow-auto touch-pan-x touch-pan-y"
            style={{
              cursor: 'default',
              height: isMobile ? '100vh' : '90vh',
              width: isMobile ? '100vw' : '100%',
              maxWidth: isMobile ? '100vw' : '90vw',
            }}
            onClick={handleImageContainerClick}
          >
            <div
              className="relative flex items-center justify-center w-full h-full"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                touchAction: zoom > 1 ? 'pan-x pan-y' : 'none',
              }}
              onClick={handleImageContainerClick}
            >
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onClick={handleImageContainerClick}
              >
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={handleImageContainerClick}
                >
                  <SmartImage
                    key={currentWallpaper.sha}
                    src={isHighQuality ? currentWallpaper.download_url : currentWallpaper.preview_url}
                    alt={currentWallpaper.name}
                    width={currentWallpaper.width}
                    height={currentWallpaper.height}
                    className={`max-h-full max-w-full object-contain ${
                      isMobile ? "" : "rounded-2xl"
                    } ${
                      isImageLoaded ? "opacity-100" : "opacity-0"
                    } transition-opacity duration-300`}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      width: 'auto',
                      height: 'auto',
                    }}
                    onLoad={() => {
                      setIsImageLoaded(true)
                      setIsImageLoading(false)
                      setIsPreviewLoaded(true)
                      if (isHighQuality) {
                        setIsLoadingHighQuality(false)
                      }
                    }}
                    onError={() => {
                      setIsImageLoading(false)
                      if (isHighQuality) {
                        setIsLoadingHighQuality(false)
                        setIsHighQuality(false)
                        showNotification("Failed to load high quality image")
                      }
                    }}
                    priority
                    quality={isHighQuality ? 100 : 75}
                    sizes="100vw"
                    onClick={handleImageContainerClick}
                  />
                </div>
              </div>
            </div>
            {showLoadingSpinner && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${disableBlur ? '' : 'backdrop-blur-sm'} rounded-2xl transition-opacity duration-200 pointer-events-none`}>
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            {/* Loading overlay for high quality image */}
            {isLoadingHighQuality && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  <p className="text-white/90 text-sm">Loading high quality image...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Wallpapers Modal */}
      <SimilarWallpapers 
        currentWallpaper={currentWallpaper}
        isVisible={showSimilarWallpapers}
        onClose={() => setShowSimilarWallpapers(false)}
        onSelectWallpaper={(newWallpaper) => {
          // Close the similar wallpapers tray
          setShowSimilarWallpapers(false);
          
          // Push current wallpaper onto history stack so user can go back
          setHistory(prev => [...prev, currentWallpaper]);
          
          // Validate and fix URL construction
          const validateUrl = (url: string) => {
            try {
              new URL(url);
              return url;
            } catch {
              console.warn("Invalid URL:", url);
              return null;
            }
          };
          
          const completeWallpaper: Wallpaper = {
            ...newWallpaper,
            width: newWallpaper.width || 1920,
            height: newWallpaper.height || 1080,
            download_url: validateUrl(newWallpaper.download_url) || newWallpaper.preview_url,
            preview_url: validateUrl(newWallpaper.preview_url) || newWallpaper.download_url,
          };
          
          // Update the current wallpaper directly
          setCurrentWallpaper(completeWallpaper);
          onSelectWallpaper?.(completeWallpaper);
        }}
      />

      {/* Top header with back button and info */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4 flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          {history.length > 0 ? (
            <>
              <button 
                type="button"
                onClick={handleBack}
                className={`flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white px-2.5 sm:px-4 py-2 rounded-full bg-black/80 hover:bg-black/95 ${disableBlur ? '' : 'backdrop-blur-md'} border border-white/10 shadow-lg transition-colors duration-150`}
                title="Back to previous wallpaper"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-xs sm:text-sm font-medium">Back</span>
                <span className="text-[10px] sm:text-xs text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              </button>
              
              <button 
                type="button"
                onClick={onClose}
                className={`flex items-center justify-center w-9 h-9 rounded-full bg-black/80 hover:bg-black/95 ${disableBlur ? '' : 'backdrop-blur-md'} border border-white/10 text-white/80 hover:text-white shadow-lg transition-colors duration-150`}
                title="Close"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={onClose} 
              className={`flex items-center justify-center gap-1.5 sm:gap-2 text-white/90 hover:text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full bg-black/80 hover:bg-black/95 ${disableBlur ? '' : 'backdrop-blur-md'} border border-white/10 shadow-lg transition-colors duration-150`}
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">Back</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center pointer-events-auto">
          {/* Unified Metadata & Resolution Capsule */}
          <div className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full ${
            disableBlur ? 'bg-[#121212]' : 'bg-[#0D0D0D]/90 backdrop-blur-md'
          } border border-white/10 shadow-lg text-xs select-none`}>
            {/* Platform & Download Info */}
            <div className="flex items-center gap-2 text-white/70">
              {currentWallpaper.platform && (
                <span className="font-medium text-white/75">{currentWallpaper.platform}</span>
              )}
              {Boolean(downloadCount && downloadCount > 0) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="flex items-center gap-1 font-mono text-white/60">
                    <Download className="w-3 h-3 text-white/50" />
                    <span>{formatDownloadCount(downloadCount!)}</span>
                  </span>
                </>
              )}
            </div>

            {/* Subtle Divider */}
            {currentWallpaper.download_url && (
              <div className="w-px h-3 bg-white/15" />
            )}

            {/* Resolution & Quality Action / Status */}
            {currentWallpaper.download_url && (
              !isHighQuality && !isLoadingHighQuality ? (
                <button
                  type="button"
                  onClick={loadHighQualityImage}
                  className="flex items-center gap-1.5 px-2 py-0.5 -mr-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Switch to full uncompressed resolution"
                >
                  <Maximize2 className="w-3 h-3 text-white/60" />
                  <span className="font-mono text-[11px] font-medium tracking-tight text-white/90">
                    {resolutionLabel ? `Full ${resolutionLabel}` : "Full res"}
                  </span>
                </button>
              ) : isLoadingHighQuality ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 -mr-1 text-white/70">
                  <Loader2 className="w-3 h-3 text-white/60 animate-spin" />
                  <span className="font-mono text-[11px] tracking-tight text-white/70">
                    Loading {resolutionLabel || "res"}...
                  </span>
                </div>
              ) : isHighQuality ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 -mr-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px] font-medium tracking-tight text-emerald-300">
                    {resolutionLabel || "HD"}
                  </span>
                  <span className="text-[11px] text-white/50 font-normal">Full res</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
      
      {/* Central Left & Right Navigation Buttons */}
      {(onPrevious || onNext) && (
        <>
          {onPrevious && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!hasPrevious) return;
                if (history.length > 0) setHistory([]);
                onPrevious();
              }}
              disabled={!hasPrevious}
              className={`fixed left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full ${
                disableBlur ? 'bg-[#121212]' : 'bg-[#0D0D0D]/85 backdrop-blur-md'
              } border border-white/10 ${
                hasPrevious
                  ? 'hover:border-white/25 hover:bg-white/[0.08] text-white/80 hover:text-white cursor-pointer'
                  : 'opacity-20 cursor-not-allowed text-white/30 border-white/5'
              } shadow-2xl transition-colors duration-150 select-none pointer-events-auto`}
              title={hasPrevious ? "Previous wallpaper" : "First wallpaper"}
              aria-label="Previous wallpaper"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {onNext && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!hasNext) return;
                if (history.length > 0) setHistory([]);
                onNext();
              }}
              disabled={!hasNext}
              className={`fixed right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full ${
                disableBlur ? 'bg-[#121212]' : 'bg-[#0D0D0D]/85 backdrop-blur-md'
              } border border-white/10 ${
                hasNext
                  ? 'hover:border-white/25 hover:bg-white/[0.08] text-white/80 hover:text-white cursor-pointer'
                  : 'opacity-20 cursor-not-allowed text-white/30 border-white/5'
              } shadow-2xl transition-colors duration-150 select-none pointer-events-auto`}
              title={hasNext ? "Next wallpaper" : "Last wallpaper"}
              aria-label="Next wallpaper"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </>
      )}

      {/* Bottom Unified Floating Dock */}
      <div className="fixed bottom-6 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
        <div className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full ${
          disableBlur ? 'bg-[#121212]' : 'bg-[#0D0D0D]/90 backdrop-blur-2xl'
        } border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto select-none`}>
          
          {/* Zoom controls (desktop only: hidden sm:flex) */}
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/[0.04]">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom === 1}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-white/80 text-xs font-mono w-6 text-center select-none font-medium">
              {zoom}x
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom === 3}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider between Zoom and Similar (desktop only) */}
          <div className="hidden sm:block w-px h-3.5 bg-white/10 mx-0.5" />

          {/* Similar Wallpapers button */}
          <button
            type="button"
            onClick={() => setShowSimilarWallpapers(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer select-none ${
              showSimilarWallpapers
                ? 'bg-white/15 text-white'
                : 'text-white/75 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={showSimilarWallpapers ? "Close similar wallpapers" : "Discover similar wallpapers"}
          >
            <Images
              className={`w-3.5 h-3.5 ${
                showSimilarWallpapers ? 'text-white' : 'text-white/75'
              }`}
            />
            <span className="tracking-tight">Similar</span>
          </button>

          {/* Divider between Mode Toggle and Action Group */}
          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* Favorite button */}
          <button
            type="button"
            onClick={() => toggleFavorite(currentWallpaper.sha)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              isFavorite(currentWallpaper.sha)
                ? 'text-rose-400 bg-rose-500/15'
                : 'text-white/75 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={isFavorite(currentWallpaper.sha) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-4 h-4 ${isFavorite(currentWallpaper.sha) ? 'fill-current' : ''}`} />
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/[0.08] transition-colors duration-150 cursor-pointer"
            title="Share wallpaper"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Solid Primary Download Button without stray divider */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download wallpaper"
            aria-label="Download wallpaper"
            className="flex items-center gap-1.5 h-8 px-4 ml-1 rounded-full bg-[#EDEDED] hover:bg-white text-black text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-60 shadow-xs select-none"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isDownloaded ? (
              <Check className="w-3.5 h-3.5 text-black" />
            ) : (
              <Download className="w-3.5 h-3.5 text-black" />
            )}
            <span className="tracking-tight">
              {isDownloading ? "Saving..." : isDownloaded ? "Saved" : "Download"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function formatResolution(resolution: string): string {
  const [width, height] = resolution.split("x").map(Number)
  
  if (!width || !height) {
    return resolution
  }

  // Common resolution mappings
  const resolutionMap: { [key: string]: string } = {
    '1920x1080': '1080p',
    '2560x1440': '1440p',
    '3840x2160': '4K',
    '7680x4320': '8K',
    '1280x720': '720p',
    '1366x768': 'HD',
    '1600x900': 'HD+',
    '2048x1152': 'QWXGA',
    '2560x1600': 'WQXGA',
    '3440x1440': 'UWQHD',
    '5120x2880': '5K',
    '1080x1920': '1080p Portrait',
    '1440x2560': '1440p Portrait',
    '2160x3840': '4K Portrait',
  }

  const key = `${width}x${height}`
  
  // Return mapped resolution name if available, otherwise format as "width x height"
  return resolutionMap[key] || `${width} x ${height}`
}