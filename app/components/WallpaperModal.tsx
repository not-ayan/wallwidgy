"use client"

import { useState, useEffect, useRef, useCallback } from "react"
// SmartImage: tries optimized, then unoptimized, then shows error UI
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
  const [forceUnoptimized, setForceUnoptimized] = useState(false);
  const [error, setError] = useState(false);

  const handleImageError = useCallback(() => {
    if (!forceUnoptimized) {
      setForceUnoptimized(true);
      setError(false);
    } else {
      setError(true);
      if (onError) onError();
    }
  }, [forceUnoptimized, onError]);

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
      unoptimized={forceUnoptimized}
      {...rest}
    />
  );
}
import Image from "next/image"  // This is the Next.js Image component
import { Download, Share2, ChevronLeft, ChevronRight, X, Minus, Plus, Sparkles, ArrowLeft } from "lucide-react"
import Modal from "./Modal"
import Link from "next/link"
import SimilarWallpapers from "./SimilarWallpapers"
import { shouldDisableBlurEffects } from "@/lib/utils"
import { useBackHandler } from "@/hooks/use-back-handler"

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
}: WallpaperModalProps) {
  // Use internal state to manage the current wallpaper
  const [currentWallpaper, setCurrentWallpaper] = useState(initialWallpaper)
  const [originalWallpaperState, setOriginalWallpaperState] = useState<Wallpaper | null>(null)
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
  const [isHighQuality, setIsHighQuality] = useState(false)
  const [isLoadingHighQuality, setIsLoadingHighQuality] = useState(false)
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false)
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false)
  const [showSimilarWallpapers, setShowSimilarWallpapers] = useState(false)
  const [disableBlur, setDisableBlur] = useState(false)

  // Handle browser back button when modal is open
  useBackHandler({
    isActive: isOpen,
    onBack: () => {
      if (showSimilarWallpapers) {
        // If similar wallpapers are shown, close them first
        setShowSimilarWallpapers(false)
      } else if (originalWallpaperState) {
        // If we have an original wallpaper to go back to
        setCurrentWallpaper(originalWallpaperState);
        setOriginalWallpaperState(null);
        
        // Reset states for the original wallpaper
        setIsImageLoaded(false);
        setIsImageLoading(true);
        setIsPreviewLoaded(false);
        setIsHighQuality(false);
        setIsLoadingHighQuality(false);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      } else {
        // Otherwise close the modal
        onClose()
      }
    },
    priority: 2 // Higher priority than basic modals
  })

  // Check if we're viewing a recommended wallpaper (has originalWallpaper)
  const isViewingRecommendation = !!originalWallpaperState

  // Responsive viewport helpers
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const updateViewport = () => {
      setViewportDimensions({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      })
    }
    
    // Check if we should disable blur effects
    setDisableBlur(shouldDisableBlurEffects())
    
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  // Calculate dynamic positions based on viewport
  const getButtonPositions = () => {
    const { width, height } = viewportDimensions
    const isMobile = width < 768
    const isShortViewport = height < 600
    
    return {
      topButtons: {
        top: isMobile ? '1rem' : '1rem',
        left: '1rem',
        right: '1rem',
      },
      bottomButtons: {
        bottom: isShortViewport ? '0.5rem' : '1rem',
        left: '1rem',
        right: '1rem',
      },
      hdButton: {
        top: isViewingRecommendation ? (isMobile ? '4.5rem' : '5rem') : (isMobile ? '3.5rem' : '4rem'),
        right: '1rem',
      }
    }
  }

  const positions = getButtonPositions()

  // Sync with prop changes
  useEffect(() => {
    setCurrentWallpaper(initialWallpaper)
    setOriginalWallpaperState(originalWallpaper || null)
  }, [initialWallpaper, originalWallpaper])

  useEffect(() => {
    if (currentWallpaper.resolution) {
      const [width, height] = currentWallpaper.resolution.split("x").map(Number)
      setAspectRatio(width / height)
    }
  }, [currentWallpaper.resolution])

  useEffect(() => {
    setIsLoading(true)
    setIsImageLoading(true)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsHighQuality(false)
    setIsLoadingHighQuality(false)
    setShowSimilarWallpapers(false) // Reset similar wallpapers when wallpaper changes
  }, [currentWallpaper.sha])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Add focus management
  useEffect(() => {
    if (isOpen) {
      const currentModal = modalRef.current
      if (currentModal) {
        currentModal.focus()
      }
    }
  }, [isOpen])

  // Preload the high-resolution image when preview is loaded
  useEffect(() => {
    if (isOpen && currentWallpaper && isPreviewLoaded) {
      const img = new window.Image();  // Use window.Image to reference the browser's Image constructor
      img.src = currentWallpaper.download_url;
      img.onload = () => {
        setIsFullImageLoaded(true);
      };
    }
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
    const notification = document.createElement("div")
    notification.className = disableBlur 
      ? "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full text-sm z-50"
      : "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  const handleDownload = async () => {
    try {
      // Validate URL before attempting download
      if (!currentWallpaper.download_url) {
        showNotification("Download URL not available")
        return
      }
      
      // Add debug logging
      console.log("Attempting to download:", currentWallpaper.download_url)
      console.log("Wallpaper object:", currentWallpaper)
      
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
      showNotification(`Downloading ${fileName}`)
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

  // Update the background click handler
  const handleBackgroundClick = (e: React.MouseEvent) => {
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
    // Add debug logging to check if currentWallpaper has the right data
    console.log("Loading high quality for:", currentWallpaper);
    console.log("Download URL:", currentWallpaper.download_url);
    
    if (!currentWallpaper.download_url) {
      showNotification("High quality image not available");
      return;
    }
    
    setIsLoadingHighQuality(true)
    // The actual loading happens in the Image component
    setIsHighQuality(true)
    showNotification("Loading high quality image...")
  }

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 ${disableBlur ? '' : 'backdrop-blur-sm'} outline-none`}
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
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Blurred background */}
          <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 md:opacity-30"
          style={{ 
            backgroundImage: `url(${currentWallpaper.preview_url})`,
            filter: disableBlur ? 'none' : 'blur(20px)',
          }} 
        />
        <div 
          className={`absolute inset-0 bg-black/70 ${disableBlur ? '' : 'backdrop-blur-2xl'}`}
          onClick={onClose}
        />        <div 
          className="relative max-h-[100vh] md:max-h-[90vh] w-full md:w-auto md:max-w-[90vw] overflow-hidden md:rounded-2xl bg-transparent"
          onClick={handleImageContainerClick}
        >
          {/* Image container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center overflow-auto touch-pan-x touch-pan-y"
            style={{
              cursor: 'default',
              height: window.innerWidth < 768 ? '100vh' : '90vh',
              width: window.innerWidth < 768 ? '100vw' : '100%',
              maxWidth: window.innerWidth < 768 ? '100vw' : '90vw',
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
                    src={isHighQuality ? currentWallpaper.download_url : currentWallpaper.preview_url}
                    alt={currentWallpaper.name}
                    width={currentWallpaper.width}
                    height={currentWallpaper.height}
                    className={`max-h-full max-w-full object-contain ${
                      window.innerWidth < 768 ? "" : "rounded-2xl"
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
                        showNotification("High quality image loaded!")
                      }
                    }}
                    onError={() => {
                      setIsImageLoading(false)
                    }}
                    priority
                    quality={isHighQuality ? 100 : 75}
                    sizes="100vw"
                    onClick={handleImageContainerClick}
                  />
                </div>
              </div>
            </div>
            {isImageLoading && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 ${disableBlur ? '' : 'backdrop-blur-md'} rounded-2xl`}>
                <div className="loader"></div>
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
          // Close the similar wallpapers modal
          setShowSimilarWallpapers(false);
          
          // Add debug logging to see what wallpaper data we're receiving
          console.log("Selected wallpaper data:", newWallpaper);
          
          // Set the original wallpaper if we're not already viewing a recommendation
          if (!originalWallpaperState) {
            setOriginalWallpaperState(currentWallpaper);
          }
          
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
          
          // Ensure the new wallpaper has all required fields with proper URLs
          const completeWallpaper = {
            ...newWallpaper,
            // Ensure all required fields are present
            width: newWallpaper.width || 1920,
            height: newWallpaper.height || 1080,
            download_url: validateUrl(newWallpaper.download_url) || newWallpaper.preview_url,
            preview_url: validateUrl(newWallpaper.preview_url) || newWallpaper.download_url,
          };
          
          console.log("Complete wallpaper with validated URLs:", completeWallpaper);
          
          // Update the current wallpaper directly
          setCurrentWallpaper(completeWallpaper);
          // Reset states for the new wallpaper
          setIsImageLoaded(false);
          setIsImageLoading(true);
          setIsPreviewLoaded(false);
          setIsHighQuality(false);
          setIsLoadingHighQuality(false);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }}
      />

      {/* Top header with back button and info */}
      <div 
        className="absolute left-0 right-0 z-10 p-4 flex items-center justify-between"
        style={{ top: positions.topButtons.top }}
      >
        <div className="flex items-center gap-2">
          {/* When viewing a recommendation, show both Back (to original) and Close (to home) */}
          {isViewingRecommendation ? (
            <>
              <button 
                onClick={() => {
                  if (originalWallpaperState) {
                    // Go back to the original wallpaper
                    setCurrentWallpaper(originalWallpaperState);
                    setOriginalWallpaperState(null);
                    
                    // Reset states for the original wallpaper
                    setIsImageLoaded(false);
                    setIsImageLoading(true);
                    setIsPreviewLoaded(false);
                    setIsHighQuality(false);
                    setIsLoadingHighQuality(false);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }
                }}
                className={`flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-2xl bg-yellow-400/30 ${disableBlur ? '' : 'backdrop-blur-md'} shadow-lg border border-yellow-400/30`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Back</span>
              </button>
              
              <button 
                onClick={onClose}
                className={`flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-2xl bg-black/85 ${disableBlur ? '' : 'backdrop-blur-md'} shadow-lg`}
              >
                <X className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Close</span>
              </button>
            </>
          ) : (
            <button 
              onClick={onClose} 
              className={`flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-2xl bg-black/85 ${disableBlur ? '' : 'backdrop-blur-md'} shadow-lg`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Back</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Resolution and platform info */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/85 ${disableBlur ? '' : 'backdrop-blur-md'} shadow-lg`}>
            {currentWallpaper.resolution && (
              <div className="text-white/80 text-sm">
                {formatResolution(currentWallpaper.resolution)}
              </div>
            )}
            {currentWallpaper.platform && (
              <>
                <div className="w-px h-3 bg-white/20" />
                <div className="text-white/80 text-sm">
                  {currentWallpaper.platform}
                </div>
              </>
            )}
          </div>

          {/* HD Button or Quality Indicator */}
          {!isHighQuality && !isLoadingHighQuality && currentWallpaper.download_url ? (
            <button
              onClick={loadHighQualityImage}
              className="bg-black/80 text-white/90 hover:text-white px-4 py-2 rounded-xl backdrop-blur-md text-sm flex items-center gap-2 transition-all hover:bg-black/90 border border-white/10 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Load HD</span>
            </button>
          ) : isHighQuality ? (
            <div className="bg-black/80 text-white/90 px-4 py-2 rounded-xl backdrop-blur-md text-sm flex items-center gap-2 border border-white/10 shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>High Quality</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Similar Wallpapers Modal */}
      <SimilarWallpapers 
        currentWallpaper={currentWallpaper}
        isVisible={showSimilarWallpapers}
          onClose={() => setShowSimilarWallpapers(false)}
        onSelectWallpaper={(newWallpaper) => {
          // Close the similar wallpapers modal
          setShowSimilarWallpapers(false);
          
          // Add debug logging to see what wallpaper data we're receiving
          console.log("Selected wallpaper data:", newWallpaper);
          
          // Set the original wallpaper if we're not already viewing a recommendation
          if (!originalWallpaperState) {
            setOriginalWallpaperState(currentWallpaper);
          }
          
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
          
          // Ensure the new wallpaper has all required fields with proper URLs
          const completeWallpaper = {
            ...newWallpaper,
            // Ensure all required fields are present
            width: newWallpaper.width || 1920,
            height: newWallpaper.height || 1080,
            download_url: validateUrl(newWallpaper.download_url) || newWallpaper.preview_url,
            preview_url: validateUrl(newWallpaper.preview_url) || newWallpaper.download_url,
          };
          
          console.log("Complete wallpaper with validated URLs:", completeWallpaper);
          
          // Update the current wallpaper directly
          setCurrentWallpaper(completeWallpaper);          // Reset states for the new wallpaper
          setIsImageLoaded(false);
          setIsImageLoading(true);
          setIsPreviewLoaded(false);
          setIsHighQuality(false);
          setIsLoadingHighQuality(false);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }}
      />
      
      {/* Bottom controls */}
      <div 
        className="absolute left-0 right-0 p-2 sm:p-4 flex items-center justify-between"
        style={{ 
          bottom: positions.bottomButtons.bottom 
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl sm:rounded-2xl bg-black/70 backdrop-blur-md shadow-lg">
            <button
              onClick={handleZoomOut}
              disabled={zoom === 1}
              className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80 p-1 sm:p-0"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-white/80 text-xs sm:text-sm px-1.5 sm:px-2">{zoom}x</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom === 3}
              className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80 p-1 sm:p-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Navigation controls - only show if not viewing recommendation */}
          {!isViewingRecommendation && (onPrevious || onNext) && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl sm:rounded-2xl bg-black/70 backdrop-blur-md shadow-lg">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80 p-1 sm:p-0"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80 p-1 sm:p-0"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
          
          {/* Similar wallpapers button - only show if not viewing recommendation */}
          {!isViewingRecommendation && (
            <button
              onClick={() => setShowSimilarWallpapers(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl sm:rounded-2xl bg-yellow-600/40 backdrop-blur-md shadow-lg border border-yellow-500/40 hover:bg-yellow-500/40 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-white/90 text-xs sm:text-sm font-medium hidden xs:inline">Similar</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl sm:rounded-2xl bg-black/70 backdrop-blur-md shadow-lg">
          <button
            onClick={handleShare}
            className="text-white/90 hover:text-white p-1.5"
          >
            <Share2 className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
          <div className="w-px h-4 sm:h-4 bg-white/20" />
          <button
            onClick={handleDownload}
            className="text-white/90 hover:text-white p-1.5"
          >
            <Download className="w-4 h-4 sm:w-4 sm:h-4" />
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