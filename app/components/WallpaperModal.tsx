'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Download, Share2, ChevronLeft, ChevronRight, X, ZoomIn, Loader2 } from 'lucide-react'
import Modal from './Modal'
import { Slider } from "@/components/ui/slider"
import Link from 'next/link';
import BottomSheet from './BottomSheet'

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: {
    name: string;
    download_url: string;
    resolution?: string;
    tag?: string;
    blurHash?: string;
    tags?: string[];
    colors?: string[];
  };
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function WallpaperModal({ 
  isOpen, 
  onClose, 
  wallpaper,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext 
}: WallpaperModalProps) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (wallpaper.resolution) {
      const [width, height] = wallpaper.resolution.split('x').map(Number)
      setAspectRatio(width / height)
    }
  }, [wallpaper.resolution])

  useEffect(() => {
    setIsLoading(true)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [wallpaper])

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/wallpaper/${encodeURIComponent(wallpaper.name)}`;
      
      if (navigator.canShare && navigator.canShare({ url: shareUrl })) {
        await navigator.share({
          title: 'Minimalist Wallpaper',
          text: `Check out this minimalist wallpaper: ${wallpaper.name}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showNotification('Link copied to clipboard!');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        showNotification('Link copied to clipboard!');
      } catch (clipboardError) {
        showNotification('Unable to share or copy link');
      }
    }
  }

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  const handleDownload = async () => {
    const link = document.createElement('a')
    link.href = wallpaper.download_url
    link.download = wallpaper.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsDragging(true)
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
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
        y: e.touches[0].clientY - position.y
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

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
    if (value[0] === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handlePreviousWallpaper = () => {
    if (hasPrevious) {
      setIsLoading(true)
      onPrevious?.()
    }
  }

  const handleNextWallpaper = () => {
    if (hasNext) {
      setIsLoading(true)
      onNext?.()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black flex flex-col md:flex-row">
        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center p-4 relative z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {wallpaper.resolution && (
              <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                {wallpaper.resolution}
              </div>
            )}
            {wallpaper.tag && (
              <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                {wallpaper.tag}
              </div>
            )}
          </div>
        </div>

        {/* Image container */}
        <div 
          ref={containerRef}
          className="relative flex-1 overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: zoom > 1 ? 'move' : 'default' }}
        >
          <div 
            className={`absolute inset-0 transition-transform duration-200 ${isDragging ? '' : 'ease-out'}`}
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
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={wallpaper.blurHash || `data:image/svg+xml;base64,${Buffer.from(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a1a1a"/></svg>'
              ).toString('base64')}`}
              onLoadingComplete={() => setIsLoading(false)}
            />
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            {hasPrevious && (
              <button
                onClick={handlePreviousWallpaper}
                className="p-2 m-4 rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            {hasNext && (
              <button
                onClick={handleNextWallpaper}
                className="p-2 m-4 rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 bg-black/60 backdrop-blur-sm rounded-full">
            <ZoomIn className="w-4 h-4 text-white" />
            <Slider
              defaultValue={[1]}
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={handleZoomChange}
              className="w-32"
            />
            <span className="text-white text-sm">{zoom.toFixed(1)}x</span>
          </div>
        </div>

        {/* Mobile bottom sheet */}
        <div className="md:hidden">
          <BottomSheet
            preview={
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{wallpaper.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-full bg-[#F7F06D] text-black"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full bg-white/10 text-white"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-white">{wallpaper.name}</h3>
              
              <div className="space-y-4">
                {wallpaper.resolution && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F7F06D]" />
                    <span className="text-white/80">{wallpaper.resolution}</span>
                  </div>
                )}
                {wallpaper.tag && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F7F06D]" />
                    <span className="text-white/80">{wallpaper.tag}</span>
                  </div>
                )}
              </div>

              {wallpaper.tags && wallpaper.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {wallpaper.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/category/${encodeURIComponent(tag)}`}
                        className="px-3 py-1 rounded-full bg-white/5 text-white/80 text-sm"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {wallpaper.colors && wallpaper.colors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-3">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {wallpaper.colors.map((color) => (
                      <Link
                        key={color}
                        href={`/color/${encodeURIComponent(color)}`}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/80 text-sm"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        {color}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                <button
                  onClick={handleDownload}
                  className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Wallpaper</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full bg-white/5 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              <p className="text-white/60 text-sm text-center">
                These tags are ai generated and ai can make mistakes
              </p>
            </div>
          </BottomSheet>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex w-[400px] flex-shrink-0 flex-col bg-[#0A0A0A] p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-6">{wallpaper.name}</h2>
            
            <div className="space-y-4 mb-8">
              {wallpaper.resolution && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F7F06D]" />
                  <span className="text-white/80">{wallpaper.resolution}</span>
                </div>
              )}
              {wallpaper.tag && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F7F06D]" />
                  <span className="text-white/80">{wallpaper.tag}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {wallpaper.tags && wallpaper.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white/60 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {wallpaper.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/category/${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {wallpaper.colors && wallpaper.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white/60 mb-3">Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {wallpaper.colors.map((color) => (
                    <Link
                      key={color}
                      href={`/color/${encodeURIComponent(color)}`}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      {color}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <button
                onClick={handleDownload}
                className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-lg hover:bg-[#F7F06D]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Wallpaper</span>
              </button>
              
              <button
                onClick={handleShare}
                className="w-full bg-white/5 text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm">
              These tags are ai generated and ai can make mistakes
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}


function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'darkslategray': '#2F4F4F',
    'black': '#000000',
    // Add more color mappings as needed
  }
  return colorMap[colorName.toLowerCase()] || '#000000'
}

