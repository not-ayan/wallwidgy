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
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.name)}`

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Blurred background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 hidden md:block"
          style={{ 
            backgroundImage: `url(${wallpaper.download_url})`,
            filter: 'blur(20px)',
          }} 
        />
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-2xl"
          onClick={onClose}
        />

        <div 
          className="relative max-h-[100vh] md:max-h-[90vh] w-full md:w-auto md:max-w-[90vw] overflow-hidden md:rounded-2xl bg-transparent md:bg-[#0A0A0A]/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top header with back button and info */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-4 pt-12 sm:pt-4 flex items-center justify-between">
            <button 
              onClick={onClose} 
              className="flex items-center gap-2 text-white/90 hover:text-white px-5 py-3.5 sm:px-3 sm:py-2 rounded-2xl bg-black/30 backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2 px-5 py-3.5 sm:px-3 sm:py-2 rounded-2xl bg-black/30 backdrop-blur-md">
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

          {/* Image container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center overflow-auto touch-pan-x touch-pan-y"
            style={{ 
              cursor: 'default',
              height: window.innerWidth < 768 ? '100vh' : 'auto',
              width: window.innerWidth < 768 ? '100%' : 'auto',
              maxWidth: window.innerWidth < 768 ? '100vw' : '90vw',
              maxHeight: window.innerWidth < 768 ? '100vh' : '90vh'
            }}
          >
            <div
              className="relative h-full md:h-auto"
              style={{
                transform: `scale(${zoom})`,
                height: window.innerWidth < 768 ? '100%' : 'auto',
                width: zoom === 1 ? 'auto' : '100%',
                touchAction: zoom > 1 ? 'pan-x pan-y' : 'none',
              }}
            >
              <Image
                ref={imageRef}
                src={wallpaper.download_url || "/placeholder.svg"}
                alt={wallpaper.name}
                width={2000}
                height={2000}
                className={`object-contain transition-opacity duration-300 h-full md:h-auto md:max-h-[90vh] ${
                  isImageLoading ? "opacity-0" : "opacity-100"
                }`}
                style={{
                  width: 'auto',
                  height: window.innerWidth < 768 ? '100%' : 'auto',
                }}
                sizes="(max-width: 768px) 100vw, 90vw"
                priority
                onLoadingComplete={() => {
                  setIsLoading(false)
                  setIsImageLoading(false)
                }}
                onLoad={() => setIsImageLoading(false)}
              />
            </div>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md">
                <div className="loader"></div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-4 pb-12 sm:pb-4">
            <div className="w-full md:w-auto md:max-w-[90vw] mx-auto flex items-center justify-between">
              {/* Navigation and zoom controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl bg-black/30 backdrop-blur-md">
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

                <div className="flex items-center gap-4 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl bg-black/30 backdrop-blur-md">
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
              <div className="flex items-center gap-4 px-5 py-3.5 sm:px-4 sm:py-2 rounded-2xl bg-black/30 backdrop-blur-md">
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
    </Modal>
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

