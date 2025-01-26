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
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - startPos.x
      const newY = e.clientY - startPos.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsDragging(true)
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1) {
      const newX = e.touches[0].clientX - startPos.x
      const newY = e.touches[0].clientY - startPos.y
      setPosition({ x: newX, y: newY })
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="relative w-full h-full md:w-[90%] md:h-[90%] md:max-w-6xl md:rounded-2xl md:overflow-hidden bg-[#0A0A0A]">
          {/* Mobile header */}
          <div className="md:hidden flex justify-between items-center p-4 relative z-10">
            <button onClick={onClose} className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {wallpaper.resolution && (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                  {formatResolution(wallpaper.resolution)}
                </div>
              )}
              {wallpaper.platform && (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                  {wallpaper.platform}
                </div>
              )}
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden md:flex justify-between items-center p-4 relative z-10">
            <div className="flex items-center gap-2">
              {wallpaper.resolution && (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                  {formatResolution(wallpaper.resolution)}
                </div>
              )}
              {wallpaper.platform && (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                  {wallpaper.platform}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image container */}
          <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden h-[calc(100%-8rem)]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoom > 1 ? "move" : "default" }}
          >
            <div
              className={`absolute inset-0 transition-transform duration-200 ${isDragging ? "" : "ease-out"}`}
              style={{
                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              }}
            >
              <Image
                ref={imageRef}
                src={wallpaper.download_url || "/placeholder.svg"}
                alt={wallpaper.name}
                fill
                className={`object-contain transition-opacity duration-300 ${
                  isImageLoading ? "opacity-0" : "opacity-100"
                }`}
                sizes="100vw"
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
            {/* Navigation buttons */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              {hasPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 m-4 rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              {hasNext && (
                <button
                  onClick={onNext}
                  className="p-2 m-4 rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4">
            {/* Zoom controls */}
            <div className="flex items-center gap-2 p-2 bg-black/60 backdrop-blur-sm rounded-full">
              <button
                onClick={handleZoomOut}
                disabled={zoom === 1}
                className="p-2 rounded-full bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white text-sm px-2">{zoom}x</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom === 3}
                className="p-2 rounded-full bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-3 rounded-full bg-[#F7F06D] text-black hover:bg-[#F7F06D]/90 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
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

