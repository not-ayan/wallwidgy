"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import Masonry from "react-masonry-css"

interface Wallpaper {
  sha: string
  name: string
  preview_url: string
  download_url: string
  resolution: string
  tag: "Mobile" | "Desktop"
  uploadDate: Date
  width: number
  height: number
}

interface WallpaperGridProps {
  sortBy?: "newest" | "default" | "name" | "color"
  limit?: number
  category?: string
  color?: string
  wallpapers?: string[]
}

export default function WallpaperGrid({
  sortBy = "name",
  limit = 25,
  category,
  color,
  wallpapers,
}: WallpaperGridProps) {
  const [user] = useAuthState(auth)
  const [wallpapersState, setWallpapers] = useState<Wallpaper[]>([])
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
  const [currentSort, setCurrentSort] = useState<"newest" | "oldest" | "name">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    fetchWallpapers({ sortBy: currentSort })
    fetchFavorites()
    fetchAvailableColors()
  }, [currentSort, user]) // Removed unnecessary dependencies

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
    async ({ sortBy = "name" }: { sortBy?: "newest" | "oldest" | "name" } = {}) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/wallpapers")
        const data = await response.json()

        let wallpaperFiles = data.map((wallpaper: any) => ({
          sha: wallpaper.public_id,
          name: wallpaper.filename,
          width: wallpaper.width,
          height: wallpaper.height,
          preview_url: cloudinaryUrl(wallpaper.public_id, {
            width: 600,
            height: 400,
            crop: "fill",
          }),
          download_url: cloudinaryUrl(wallpaper.public_id, { isDownload: true }),
          resolution: getResolutionLabel(wallpaper.width, wallpaper.height),
          tag: wallpaper.height > wallpaper.width ? "Mobile" : "Desktop",
          uploadDate: new Date(wallpaper.created_at),
        }))

        if (wallpapers) {
          wallpaperFiles = wallpaperFiles.filter((file: Wallpaper) => wallpapers.includes(file.sha))
        }

        switch (sortBy) {
          case "newest":
            wallpaperFiles.sort((a: Wallpaper, b: Wallpaper) => b.uploadDate.getTime() - a.uploadDate.getTime())
            break
          case "oldest":
            wallpaperFiles.sort((a: Wallpaper, b: Wallpaper) => a.uploadDate.getTime() - b.uploadDate.getTime())
            break
          case "name":
            wallpaperFiles.sort((a: Wallpaper, b: Wallpaper) => a.name.localeCompare(b.name))
            break
          default:
            break
        }

        setWallpapers(wallpaperFiles)
      } catch (err: any) {
        console.error("Error fetching wallpapers:", err)
        setError(`Failed to fetch wallpapers. ${err.message || ""}`)
      } finally {
        setIsLoading(false)
      }
    },
    [], // Removed unnecessary dependencies
  )

  const fetchFavorites = useCallback(() => {
    if (user) {
      const db = getDatabase()
      const favoritesRef = ref(db, `favorites/${user.uid}`)
      onValue(favoritesRef, (snapshot) => {
        const data = snapshot.val()
        setFavorites(data ? Object.keys(data) : [])
      })
    } else {
      const storedFavorites = localStorage.getItem("favorites")
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites))
      }
    }
  }, [user])

  const toggleFavorite = useCallback(
    (sha: string) => {
      if (user) {
        const db = getDatabase()
        const favoritesRef = ref(db, `favorites/${user.uid}/${sha}`)
        if (favorites.includes(sha)) {
          set(favoritesRef, null)
        } else {
          set(favoritesRef, true)
        }
      } else {
        const updatedFavorites = favorites.includes(sha)
          ? favorites.filter((favSha) => favSha !== sha)
          : [...favorites, sha]
        setFavorites(updatedFavorites)
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
      }
    },
    [favorites, user],
  )

  const downloadSelectedWallpapers = useCallback(async () => {
    for (const sha of selectedWallpapers) {
      const wallpaper = wallpapersState.find((w) => w.sha === sha)
      if (wallpaper) {
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
      }
    }
    setSelectedWallpapers([])
  }, [selectedWallpapers, wallpapersState])

  const showNotification = useCallback((message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }, [])

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  const handleFilterChange = useCallback((newFilter: "all" | "desktop" | "mobile") => {
    setFilter(newFilter)
  }, [])

  const handleOpenModal = useCallback(
    (wallpaper: Wallpaper) => {
      const index = wallpapersState.findIndex((w) => w.sha === wallpaper.sha)
      setSelectedIndex(index)
      setSelectedWallpaper(wallpaper)
    },
    [wallpapersState],
  )

  const handlePreviousWallpaper = useCallback(() => {
    if (selectedIndex > 0) {
      const filteredWallpapers = wallpapersState.filter((w) => filter === "all" || w.tag.toLowerCase() === filter)
      const currentFilteredIndex = filteredWallpapers.findIndex((w) => w.sha === selectedWallpaper?.sha)
      if (currentFilteredIndex > 0) {
        const prevWallpaper = filteredWallpapers[currentFilteredIndex - 1]
        const globalIndex = wallpapersState.findIndex((w) => w.sha === prevWallpaper.sha)
        setSelectedIndex(globalIndex)
        setSelectedWallpaper(prevWallpaper)
      }
    }
  }, [selectedIndex, wallpapersState, filter, selectedWallpaper])

  const handleNextWallpaper = useCallback(() => {
    const filteredWallpapers = wallpapersState.filter((w) => filter === "all" || w.tag.toLowerCase() === filter)
    const currentFilteredIndex = filteredWallpapers.findIndex((w) => w.sha === selectedWallpaper?.sha)
    if (currentFilteredIndex < filteredWallpapers.length - 1) {
      const nextWallpaper = filteredWallpapers[currentFilteredIndex + 1]
      const globalIndex = wallpapersState.findIndex((w) => w.sha === nextWallpaper.sha)
      setSelectedIndex(globalIndex)
      setSelectedWallpaper(nextWallpaper)
    }
  }, [wallpapersState, filter, selectedWallpaper])

  const handleImageLoad = useCallback((sha: string) => {
    setLoadedImages((prev) => new Set(prev).add(sha))
  }, [])

  const toggleWallpaperSelection = useCallback((sha: string) => {
    setSelectedWallpapers((prev) => {
      if (prev.includes(sha)) {
        return prev.filter((s) => s !== sha)
      } else {
        return [...prev, sha]
      }
    })
  }, [])

  const handleShare = useCallback(async (wallpaper: Wallpaper) => {
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
  }, [])

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
          className="bg-[#F7F06D] text-black px-4 py-2 rounded-full hover:bg-[#F7F06D]/90 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const breakpointColumnsObj = {
    default: 4,
    1400: 3,
    1100: 2,
    700: 1,
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative">
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 rounded-full p-1">
            <button
              onClick={() => setCurrentSort("name")}
              className={`p-2 rounded-full transition-colors ${
                currentSort === "name" ? "bg-[#F7F06D] text-black" : "text-white hover:bg-white/10"
              }`}
              title="Sort by name"
            >
              <ArrowDownAZ className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSort("newest")}
              className={`p-2 rounded-full transition-colors ${
                currentSort === "newest" ? "bg-[#F7F06D] text-black" : "text-white hover:bg-white/10"
              }`}
              title="Latest uploads"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSort("oldest")}
              className={`p-2 rounded-full transition-colors ${
                currentSort === "oldest" ? "bg-[#F7F06D] text-black" : "text-white hover:bg-white/10"
              }`}
              title="Oldest uploads"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {wallpapersState
          .filter((wallpaper) => filter === "all" || wallpaper.tag.toLowerCase() === filter)
          .map((wallpaper) => (
            <div key={wallpaper.sha} className="mb-4 sm:mb-6">
              <div
                className="group relative overflow-hidden rounded-2xl bg-white/5"
                style={{
                  aspectRatio: window.innerWidth < 768 ? "16/9" : `${wallpaper.width}/${wallpaper.height}`,
                }}
                data-wallpaper-sha={wallpaper.sha}
              >
                <Image
                  src={wallpaper.preview_url || "/placeholder.svg"}
                  alt={wallpaper.name}
                  width={600}
                  height={400}
                  className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {wallpaper.resolution && (
                  <div className="absolute top-3 left-3 bg-[#F7F06D] text-black px-2 py-1 rounded-full text-xs font-medium">
                    {wallpaper.resolution}
                  </div>
                )}
                {wallpaper.tag && (
                  <div className="absolute top-3 right-3 bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {wallpaper.tag}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[15px] font-medium text-white/90">{wallpaper.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleWallpaperSelection(wallpaper.sha)}
                        className={`p-2 rounded-full ${
                          selectedWallpapers.includes(wallpaper.sha)
                            ? "bg-[#F7F06D] text-black"
                            : "bg-black/60 text-white hover:bg-black/70"
                        } backdrop-blur-sm transition-all hover:scale-105`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(wallpaper.sha)}
                        className={`p-2 rounded-full ${
                          favorites.includes(wallpaper.sha)
                            ? "bg-[#F7F06D] text-black"
                            : "bg-black/60 text-white hover:bg-black/70"
                        } backdrop-blur-sm transition-all hover:scale-105`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(wallpaper)}
                        className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(wallpaper)}
                        className="p-2 rounded-full bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-105"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </Masonry>

      {selectedWallpapers.length > 0 && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={downloadSelectedWallpapers}
            className="bg-[#F7F06D]/10 text-[#F7F06D] px-5 py-2.5 rounded-full hover:bg-[#F7F06D]/15 transition-all text-[13px] font-medium flex items-center gap-2 animate-bounce backdrop-blur-lg"
            style={{ width: "auto" }}
          >
            <Download className="w-4 h-4" />
            Download Selected ({selectedWallpapers.length})
          </button>
        </div>
      )}

      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 flex gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1 rounded-full text-xs ${filter === "all" ? "bg-[#F7F06D] text-black" : "text-white"}`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("desktop")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "desktop" ? "bg-[#F7F06D] text-black" : "text-white"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => handleFilterChange("mobile")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "mobile" ? "bg-[#F7F06D] text-black" : "text-white"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {selectedWallpaper && (
        <WallpaperModal
          isOpen={true}
          onClose={() => {
            setSelectedWallpaper(null)
            setSelectedIndex(-1)
          }}
          wallpaper={selectedWallpaper}
          onPrevious={handlePreviousWallpaper}
          onNext={handleNextWallpaper}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < wallpapersState.length - 1}
        />
      )}
    </div>
  )
}

function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
    isDownload?: boolean
  },
) {
  const transformations = options.isDownload ? [] : ["f_auto", "q_auto"]

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transformationString = transformations.join(",")

  if (options.isDownload) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
  } else {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`
  }
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

