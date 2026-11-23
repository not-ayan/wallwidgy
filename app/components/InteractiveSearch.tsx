"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import {
  Search,
  X,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Sparkles,
  Heart,
  Download,
  ChevronRight,
  LayoutList,
  Grid2X2,
  Copy,
  Check,
} from "lucide-react"
import WallpaperModal, { Wallpaper } from "./WallpaperModal"
import { getRawWallpaperIndex } from "@/lib/wallpaper-store"
import { createLatestRequestGuard } from "@/lib/ui-state-helpers"
import { useFavorites } from "@/hooks/use-favorites"
import { useBackHandler } from "@/hooks/use-back-handler"
import { trackDownload } from "@/lib/analytics"
import { showSakugaToast } from "@/lib/toast"

interface InteractiveSearchProps {
  mode: "modal" | "embedded"
  isOpen?: boolean
  onClose?: () => void
  initialQuery?: string
  onQueryChange?: (query: string) => void
}

const CURATED_TAGS = [
  "Minimalist",
  "Anime",
  "Nature",
  "AMOLED",
  "Abstract",
  "Dark",
  "Cars",
  "Art",
]

export default function InteractiveSearch({
  mode,
  isOpen = true,
  onClose,
  initialQuery = "",
  onQueryChange,
}: InteractiveSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [platform, setPlatform] = useState<"all" | "desktop" | "mobile">("all")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [showFilters, setShowFilters] = useState(true)
  const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([])
  const [filteredResults, setFilteredResults] = useState<Wallpaper[]>([])
  const [visibleCount, setVisibleCount] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [copiedSha, setCopiedSha] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchGuardRef = useRef(createLatestRequestGuard())
  const { toggleFavorite, isFavorite } = useFavorites()

  // Handle Android & browser back gestures when search modal is open
  useBackHandler({
    isActive: mode === "modal" && isOpen,
    onBack: () => onClose?.(),
    priority: 1,
  })

  // Sync initial query
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  // Focus input when modal opens or mounted
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Load and cache raw wallpaper index on mount
  useEffect(() => {
    let isMounted = true
    getRawWallpaperIndex()
      .then((data) => {
        if (!isMounted) return
        const normalized: Wallpaper[] = data.map((item: any) => {
          const mainFileName = item.file_main_name || `${item.file_name}.png`
          const cacheFileName = item.file_cache_name || `${item.file_name}.webp`
          return {
            sha: item.file_name,
            name: mainFileName,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
            preview_url: `https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/${cacheFileName}`,
            resolution: item.resolution || `${item.width}x${item.height}`,
            platform: (item.orientation === "Mobile" ? "Mobile" : "Desktop") as "Desktop" | "Mobile",
            width: item.width,
            height: item.height,
          }
        })
        setAllWallpapers(normalized)
      })
      .catch((err) => console.error("Error loading index in InteractiveSearch:", err))

    return () => {
      isMounted = false
    }
  }, [])

  // Counts for pills
  const counts = useMemo(() => {
    const desktop = allWallpapers.filter((w) => w.platform === "Desktop").length
    const mobile = allWallpapers.filter((w) => w.platform === "Mobile").length
    return {
      all: allWallpapers.length,
      desktop,
      mobile,
    }
  }, [allWallpapers])

  // Perform search query
  const performSearch = useCallback(
    async (searchQuery: string, currentPlatform: "all" | "desktop" | "mobile", tag: string | null) => {
      const trimmed = searchQuery.trim()
      const effectiveQuery = tag ? (trimmed ? `${trimmed} ${tag}` : tag) : trimmed

      const requestId = searchGuardRef.current.next()
      setIsLoading(true)

      try {
        const rawIndex = await getRawWallpaperIndex()
        if (!searchGuardRef.current.isCurrent(requestId)) return

        let matches = rawIndex

        if (effectiveQuery) {
          const qTerms = effectiveQuery.toLowerCase().split(/\s+/).filter(Boolean)
          matches = rawIndex.filter((item: any) => {
            if (!item.data) return false

            const searchableStrings = [
              item.file_name || "",
              item.file_main_name || "",
              item.data.art_style || "",
              item.data.series || "",
              item.data.category || "",
              item.data.mood || "",
              item.data.technique || "",
              item.data.color_palette || "",
              item.data.scene_description || "",
            ].map((s) => s.toLowerCase())

            const arrayStrings = [
              item.data.character_names || [],
              item.data.primary_colors || [],
              item.data.secondary_colors || [],
              item.data.tags || [],
              item.data.objects || [],
              item.data.textures || [],
            ]
              .flat()
              .filter((v: any) => typeof v === "string")
              .map((s: string) => s.toLowerCase())

            const combined = [...searchableStrings, ...arrayStrings]

            return qTerms.every((term) => combined.some((str) => str.includes(term)))
          })
        }

        const normalized: Wallpaper[] = matches.map((item: any) => {
          const mainFileName = item.file_main_name || `${item.file_name}.png`
          const cacheFileName = item.file_cache_name || `${item.file_name}.webp`
          return {
            sha: item.file_name,
            name: mainFileName,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
            preview_url: `https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/${cacheFileName}`,
            resolution: item.resolution || `${item.width}x${item.height}`,
            platform: (item.orientation === "Mobile" ? "Mobile" : "Desktop") as "Desktop" | "Mobile",
            width: item.width,
            height: item.height,
          }
        })

        const platformFiltered =
          currentPlatform === "all"
            ? normalized
            : normalized.filter((w) => w.platform.toLowerCase() === currentPlatform)

        if (!searchGuardRef.current.isCurrent(requestId)) return
        setFilteredResults(platformFiltered)
        setVisibleCount(20)
        setSelectedIndex(-1)
      } catch (err) {
        if (!searchGuardRef.current.isCurrent(requestId)) return
        console.error("Search failed:", err)
        setFilteredResults([])
      } finally {
        if (searchGuardRef.current.isCurrent(requestId)) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  // Trigger search on query / platform / tag change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, platform, activeTag)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, platform, activeTag, performSearch])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && filteredResults.length > visibleCount) {
          setVisibleCount((prev) => Math.min(prev + 20, filteredResults.length))
        }
      },
      { rootMargin: "0px 0px 300px 0px" }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [filteredResults.length, visibleCount])

  // Handle keyboard navigation inside the interactive search bar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      if (mode === "modal" && onClose) {
        onClose()
      } else if (query || activeTag) {
        setQuery("")
        setActiveTag(null)
        onQueryChange?.("")
      }
      return
    }

    const displayed = filteredResults.slice(0, visibleCount)
    if (displayed.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        const next = prev + 1 >= displayed.length ? 0 : prev + 1
        const targetElement = listContainerRef.current?.querySelector(`[data-index="${next}"]`)
        targetElement?.scrollIntoView({ block: "nearest", behavior: "smooth" })
        return next
      })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        const next = prev - 1 < 0 ? displayed.length - 1 : prev - 1
        const targetElement = listContainerRef.current?.querySelector(`[data-index="${next}"]`)
        targetElement?.scrollIntoView({ block: "nearest", behavior: "smooth" })
        return next
      })
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && displayed[selectedIndex]) {
        setSelectedWallpaper(displayed[selectedIndex])
      } else if (displayed.length > 0) {
        setSelectedWallpaper(displayed[0])
      }
    }
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    onQueryChange?.(val)
  }

  const handleClear = () => {
    setQuery("")
    setActiveTag(null)
    onQueryChange?.("")
    inputRef.current?.focus()
  }

  const handleCopyLink = async (e: React.MouseEvent, wallpaper: Wallpaper) => {
    e.preventDefault()
    e.stopPropagation()
    const cleanName = wallpaper.name.replace(/\.\w+$/, "")
    const shareUrl = `https://wallwidgy.app/wallpaper/${cleanName}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedSha(wallpaper.sha)
      showSakugaToast("Wallpaper link copied to clipboard")
      setTimeout(() => setCopiedSha(null), 2000)
    } catch {
      showSakugaToast("Failed to copy link")
    }
  }

  const handleDirectDownload = async (e: React.MouseEvent, wallpaper: Wallpaper) => {
    e.preventDefault()
    e.stopPropagation()
    trackDownload(wallpaper)
    showSakugaToast(`Downloading ${wallpaper.name.replace(/\.\w+$/, "")}...`)
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
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch {
      showSakugaToast("Failed to download wallpaper")
    }
  }

  if (mode === "modal" && !isOpen) return null

  const displayedWallpapers = filteredResults.slice(0, visibleCount)
  const isQueryEmpty = !query.trim() && !activeTag

  const content = (
    <div
      className="w-full max-w-2xl md:max-w-3xl lg:max-w-[860px] bg-[#0F0F0F]/95 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-[#EDEDED] antialiased animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Interactive Search Bar Capsule */}
      <div className="h-16 px-4 sm:px-5 flex items-center gap-3 border-b border-white/[0.08] relative">
        <Search className="w-5 h-5 text-[#8E8E8E] shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start Searching..."
          className="flex-1 bg-transparent text-[#EDEDED] text-[15px] sm:text-base placeholder-[#6E6E6E] outline-none font-normal font-sans tracking-tight"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Action icons right side */}
        <div className="flex items-center gap-1.5 shrink-0 text-[#8E8E8E]">
          {/* Clear button */}
          {(query || activeTag) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Toggle filter pills */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors ${
              showFilters
                ? "bg-white/[0.08] text-[#EDEDED]"
                : "hover:bg-white/[0.08] hover:text-[#EDEDED]"
            }`}
            title="Toggle filters"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Toggle View Mode: List vs Grid */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors hidden sm:flex"
            title={viewMode === "list" ? "Switch to grid view" : "Switch to list view"}
            aria-label="Toggle view mode"
          >
            {viewMode === "list" ? <Grid2X2 className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
          </button>

          {/* Close button for modal */}
          {mode === "modal" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors ml-1"
              title="Close search"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills Row (Category Chips) */}
      {showFilters && (
        <div className="px-4 sm:px-5 py-3 flex items-center gap-2 overflow-x-auto border-b border-white/[0.05] scrollbar-none select-none bg-black/20">
          {/* All */}
          <button
            type="button"
            onClick={() => {
              setPlatform("all")
              setActiveTag(null)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              platform === "all" && !activeTag
                ? "bg-[#EDEDED] text-black shadow-xs"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E8E] hover:text-[#EDEDED] border border-white/[0.06]"
            }`}
          >
            <span>All</span>
            {counts.all > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  platform === "all" && !activeTag ? "bg-black/15 text-black" : "bg-white/[0.08] text-white/50"
                }`}
              >
                {counts.all}
              </span>
            )}
          </button>

          {/* Desktop */}
          <button
            type="button"
            onClick={() => {
              setPlatform(platform === "desktop" ? "all" : "desktop")
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              platform === "desktop"
                ? "bg-[#EDEDED] text-black shadow-xs"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E8E] hover:text-[#EDEDED] border border-white/[0.06]"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
            {counts.desktop > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  platform === "desktop" ? "bg-black/15 text-black" : "bg-white/[0.08] text-white/50"
                }`}
              >
                {counts.desktop}
              </span>
            )}
          </button>

          {/* Mobile */}
          <button
            type="button"
            onClick={() => {
              setPlatform(platform === "mobile" ? "all" : "mobile")
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              platform === "mobile"
                ? "bg-[#EDEDED] text-black shadow-xs"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E8E] hover:text-[#EDEDED] border border-white/[0.06]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
            {counts.mobile > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  platform === "mobile" ? "bg-black/15 text-black" : "bg-white/[0.08] text-white/50"
                }`}
              >
                {counts.mobile}
              </span>
            )}
          </button>

          {/* Tag Chips */}
          {CURATED_TAGS.map((tag) => {
            const isSelected = activeTag?.toLowerCase() === tag.toLowerCase()
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setActiveTag(isSelected ? null : tag)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#EDEDED] text-black shadow-xs font-medium"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E8E] hover:text-[#EDEDED] border border-white/[0.06]"
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Results Viewport */}
      <div
        ref={listContainerRef}
        className="max-h-[50vh] sm:max-h-[58vh] overflow-y-auto custom-scrollbar p-3 space-y-1 focus:outline-none"
        tabIndex={-1}
      >
        {isLoading && displayedWallpapers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#8E8E8E]">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs">Searching wallpapers...</span>
          </div>
        ) : displayedWallpapers.length > 0 ? (
          <>
            {/* Section Header */}
            <div className="px-3 pt-1.5 pb-2 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-[#737373]">
              <span>Wallpapers</span>
              <span>{filteredResults.length} found</span>
            </div>

            {/* List View - Directly matching the user's reference image */}
            {viewMode === "list" ? (
              <div className="space-y-1">
                {displayedWallpapers.map((wallpaper, index) => {
                  const isHighlighted = selectedIndex === index
                  const cleanName = wallpaper.name.replace(/\.\w+$/, "")
                  const isFav = isFavorite(wallpaper.sha) || isFavorite(wallpaper.name)

                  return (
                    <div
                      key={wallpaper.sha}
                      data-index={index}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedWallpaper(wallpaper)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all duration-150 cursor-pointer border ${
                        isHighlighted
                          ? "bg-white/[0.08] border-white/[0.12]"
                          : "hover:bg-white/[0.05] border-transparent hover:border-white/[0.06]"
                      }`}
                    >
                      {/* Left: Thumbnail + Title & Tags */}
                      <div className="flex items-center min-w-0 flex-1">
                        {/* Rounded thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          <Image
                            src={wallpaper.preview_url}
                            alt={wallpaper.name}
                            fill
                            sizes="48px"
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>

                        {/* Title and metadata */}
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#EDEDED] truncate">
                              {cleanName}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${
                                wallpaper.platform === "Desktop"
                                  ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}
                            >
                              {wallpaper.platform}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#8E8E8E] mt-0.5 truncate">
                            <span>{wallpaper.resolution}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Hover action buttons + signature black arrow pill */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(wallpaper.sha || wallpaper.name)
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isFav
                              ? "text-red-400 bg-red-500/10"
                              : "text-[#8E8E8E] hover:text-white hover:bg-white/10"
                          }`}
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                          aria-label="Favorite wallpaper"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                        </button>

                        {/* Copy link */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, wallpaper)}
                          className="p-2 rounded-xl text-[#8E8E8E] hover:text-white hover:bg-white/10 transition-colors hidden sm:flex"
                          title="Copy wallpaper link"
                          aria-label="Copy link"
                        >
                          {copiedSha === wallpaper.sha ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Direct Download */}
                        <button
                          type="button"
                          onClick={(e) => handleDirectDownload(e, wallpaper)}
                          className="p-2 rounded-xl text-[#8E8E8E] hover:text-white hover:bg-white/10 transition-colors"
                          title="Download wallpaper"
                          aria-label="Download wallpaper"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Distinctive Right Chevron Pill (from user reference image) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedWallpaper(wallpaper)
                          }}
                          className="w-8 h-8 rounded-xl bg-white/[0.08] group-hover:bg-white/[0.18] text-[#EDEDED] flex items-center justify-center transition-colors shadow-xs ml-1"
                          title="Open preview"
                          aria-label="Open preview"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Grid View option */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {displayedWallpapers.map((wallpaper, index) => {
                  const isHighlighted = selectedIndex === index
                  const cleanName = wallpaper.name.replace(/\.\w+$/, "")

                  return (
                    <div
                      key={wallpaper.sha}
                      data-index={index}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedWallpaper(wallpaper)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group relative rounded-2xl overflow-hidden aspect-[9/14] bg-white/5 border transition-all duration-200 cursor-pointer ${
                        isHighlighted
                          ? "border-white/40 ring-1 ring-white/20"
                          : "border-white/[0.08] hover:border-white/25"
                      }`}
                    >
                      <Image
                        src={wallpaper.preview_url}
                        alt={wallpaper.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80">
                          {wallpaper.platform}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDirectDownload(e, wallpaper)}
                          className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/70 hover:text-white transition-colors border border-white/10"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <p className="text-xs font-medium text-white truncate">{cleanName}</p>
                        <p className="text-[10px] text-white/60 mt-0.5">{wallpaper.resolution}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Load more sentinel */}
            <div ref={loadMoreRef} className="h-6 w-full" />
          </>
        ) : isQueryEmpty ? (
          /* Empty / Initial State: Suggestions & Trending */
          <div className="py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-white/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-medium text-[#EDEDED] mb-1">Search the collection</h4>
            <p className="text-xs text-[#8E8E8E] max-w-sm mx-auto mb-5">
              Type keywords above or pick a style tag below to preview wallpapers instantly.
            </p>

            <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto">
              {CURATED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag)
                    setQuery(tag)
                    onQueryChange?.(tag)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-[#8E8E8E] hover:text-[#EDEDED] transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* No Results State */
          <div className="py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-white/30">
              <Search className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-medium text-[#EDEDED] mb-1">No wallpapers found</h4>
            <p className="text-xs text-[#8E8E8E] max-w-xs mx-auto">
              No results for &quot;{query}&quot;. Try adjusting your keywords or clearing the category filter.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Quiet Footer */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#737373] select-none bg-black/30">
        <span className="tabular-nums">
          {filteredResults.length} {filteredResults.length === 1 ? "match" : "matches"}
        </span>
        <div className="hidden sm:flex items-center gap-3">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {mode === "modal" ? (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={onClose}
        >
          {content}
        </div>
      ) : (
        content
      )}

      {/* Integrated WallpaperModal for Instant High-Res Preview */}
      {selectedWallpaper && (
        <WallpaperModal
          isOpen={!!selectedWallpaper}
          onClose={() => setSelectedWallpaper(null)}
          wallpaper={selectedWallpaper}
          onSelectWallpaper={(w) => setSelectedWallpaper(w)}
        />
      )}
    </>
  )
}
