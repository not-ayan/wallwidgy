"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"  // This is the Next.js Image component
import { Download, Share2, ChevronLeft, ChevronRight, X, Minus, Plus, Sparkles } from "lucide-react"
import Modal from "./Modal"
import Link from "next/link"

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

interface WallpaperModalProps {
  isOpen: boolean
  onClose: () => void
  wallpaper: Wallpaper
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export default function WallpaperModal({
  isOpen,
  onClose,
  wallpaper,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: WallpaperModalProps) {
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

  useEffect(() => {
    if (wallpaper.resolution) {
      const [width, height] = wallpaper.resolution.split("x").map(Number)
      setAspectRatio(width / height)
    }
  }, [wallpaper.resolution])

  useEffect(() => {
    setIsLoading(true)
    setIsImageLoading(true)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsHighQuality(false)
    setIsLoadingHighQuality(false)
  }, [wallpaper.sha])

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
    if (isOpen && wallpaper && isPreviewLoaded) {
      const img = new window.Image();  // Use window.Image to reference the browser's Image constructor
      img.src = wallpaper.download_url;
      img.onload = () => {
        setIsFullImageLoaded(true);
      };
    }
  }, [isOpen, wallpaper, isPreviewLoaded]);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.sha)}`

      if (navigator.share) {
        await navigator.share({
          title: "Wallpaper",
          text: `Check out this wallpaper: ${wallpaper.name}`,
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
    notification.className =
      "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  const handleDownload = async () => {
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
      showNotification("Download started!")
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
      showNotification("Failed to download wallpaper")
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm outline-none"
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
            backgroundImage: `url(${wallpaper.preview_url})`,
            filter: 'blur(20px)',
          }} 
        />
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
          onClick={onClose}
        />

        <div 
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
                  <Image
                    src={isHighQuality ? wallpaper.download_url : wallpaper.preview_url}
                    alt={wallpaper.name}
                    width={wallpaper.width}
                    height={wallpaper.height}
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
                    priority
                    quality={isHighQuality ? 100 : 75}
                    sizes="100vw"
                    unoptimized={isHighQuality}
                    onClick={handleImageContainerClick}
                  />
                </div>
              </div>
            </div>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md rounded-2xl">
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

      {/* High quality button - show only when not already in high quality mode */}
      {!isHighQuality && !isLoadingHighQuality && (
        <button
          onClick={loadHighQualityImage}
          className="fixed top-20 sm:top-16 right-4 z-20 bg-black/70 text-white/90 hover:text-white px-4 py-2 rounded-xl backdrop-blur-md text-sm flex items-center gap-2 transition-all hover:bg-black/80 border border-white/10"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>Load HD</span>
        </button>
      )}

      {/* Quality indicator */}
      {isHighQuality && (
        <div className="fixed top-20 sm:top-16 right-4 z-20 bg-black/40 text-white/90 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs flex items-center gap-1.5 border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>High Quality</span>
        </div>
      )}

      {/* Top header with back button and info */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-4 pt-12 sm:pt-4 flex items-center justify-between">
        <button 
          onClick={onClose} 
          className="fixed top-4 left-4 flex items-center gap-2 text-white/90 hover:text-white px-5 py-3.5 sm:px-3 sm:py-2 rounded-2xl sm:bg-black/30 sm:backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
          <span className="text-base sm:text-sm hidden sm:block">Back</span>
        </button>
        <div className="fixed top-4 right-4 flex items-center gap-2 px-5 py-3.5 sm:px-3 sm:py-2 rounded-2xl sm:bg-black/30 sm:backdrop-blur-md">
          {wallpaper.resolution && (
            <div className="text-white/80 text-base sm:text-sm">
              {formatResolution(wallpaper.resolution)}
            </div>
          )}
          {wallpaper.platform && (
            <>
              <div className="w-px h-4 sm:h-3 bg-white/20" />
              <div className="text-white/80 text-base sm:text-sm">
                {wallpaper.platform}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-4 pb-12 sm:pb-4">
        <div className="w-full md:w-auto md:max-w-[90vw] mx-auto flex items-center justify-between">
          {/* Navigation and zoom controls */}
          <div className="fixed bottom-4 left-4 flex items-center gap-4">
            <div className="flex items-center gap-2 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl sm:bg-black/30 sm:backdrop-blur-md">
              <button
                onClick={handleZoomOut}
                disabled={zoom === 1}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80"
              >
                <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <span className="text-white/80 text-base sm:text-sm px-3">{zoom}x</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom === 3}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl sm:bg-black/30 sm:backdrop-blur-md">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80"
              >
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="text-white/90 hover:text-white disabled:opacity-50 disabled:hover:text-white/80"
              >
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="fixed bottom-4 right-4 flex items-center gap-4 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl sm:bg-black/30 sm:backdrop-blur-md">
            <button
              onClick={handleShare}
              className="text-white/90 hover:text-white"
            >
              <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <div className="w-px h-4 sm:h-3 bg-white/20" />
            <button
              onClick={handleDownload}
              className="text-white/90 hover:text-white"
            >
              <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatResolution(resolution: string): string {
  const [width, height] = resolution.split("x").map(Number)
  if (width && height) {
    return `${width} x ${height}`
  }
  return resolution
}

