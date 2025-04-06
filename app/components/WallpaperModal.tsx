"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Download, Share2, ChevronLeft, ChevronRight, X, Minus, Plus } from "lucide-react"
import Modal from "./Modal"
import Link from "next/link"

interface Wallpaper {
  sha: string
  name: string
  download_url: string
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
  }, [wallpaper.sha])

  const handleShare = async () => {
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Blurred background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 md:opacity-30"
          style={{ 
            backgroundImage: `url(${wallpaper.download_url})`,
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
              width: '100%',
              maxWidth: '90vw',
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
                    src={wallpaper.download_url}
                    alt={wallpaper.name}
                    width={wallpaper.width}
                    height={wallpaper.height}
                    className={`max-h-full max-w-full object-contain rounded-2xl ${
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
                    }}
                    onError={() => {
                      console.error('Failed to load image:', wallpaper.download_url)
                      setIsImageLoading(false)
                    }}
                    priority
                    quality={100}
                    sizes="100vw"
                    unoptimized={true}
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
          </div>

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
      </div>
    </div>
  )
}

function formatResolution(resolution: string): string {
  const [width, height] = resolution.split("x").map(Number)
  if (width >= 7680 && height >= 4320) return "8K"
  if (width >= 3840 && height >= 2160) return "4K"
  if (width >= 2560 && height >= 1440) return "1440p"
  if (width >= 1920 && height >= 1080) return "1080p"
  return resolution
}

