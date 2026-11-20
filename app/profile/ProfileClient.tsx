"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useUser, useClerk } from "@clerk/nextjs"
import { useFavorites } from "@/hooks/use-favorites"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import BackToTop from "@/app/components/BackToTop"
import WallpaperModal from "@/app/components/WallpaperModal"
import { showSakugaToast } from "@/lib/toast"
import { getParsedWallpapers, Wallpaper } from "@/lib/wallpaper-store"
import { isIdMatching } from "@/lib/favorites-state"
import {
  User as UserIcon,
  Copy,
  Check,
  ExternalLink,
  Settings,
  LogOut,
  Plus,
  Trash2,
  X,
  Smartphone,
  Search,
  Camera,
  Flashlight,
  Wifi,
  Battery,
  Pencil,
  Heart,
} from "lucide-react"

// Types
export interface SetupItem {
  id?: string
  name: string
  previewUrl: string
  downloadUrl?: string
}

export interface Setup {
  id: string
  name: string
  homescreen?: SetupItem | null
  lockscreen?: SetupItem | null
}

const MAX_SETUPS = 4
const DEFAULT_BACKDROP = "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/monochrome-mountain-landscape.webp"

// Fallback curated wallpapers matching the reference aesthetic
const CURATED_SAMPLE_WALLS: Wallpaper[] = [
  {
    sha: "wall-sample-1",
    name: "Ghibli Summer House",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/orange-hair-girl-angst.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/orange-hair-girl-angst.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-2",
    name: "Crimson Vapor Nebula",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/black-abstract-.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/black-abstract-.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-3",
    name: "Sunset Wanderer",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/monochrome-mountain-landscape.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/monochrome-mountain-landscape.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-4",
    name: "Neo Tokyo Alley Cat",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/pixel-pikachu-yellow.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/pixel-pikachu-yellow.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-5",
    name: "Azure Cloud Prairie",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/🍃.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/🍃.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-6",
    name: "Wind-Swept Highlands",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/corrugated-text.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/corrugated-text.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-7",
    name: "Solar Spiral Energy",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/bleach-espada-g.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/bleach-espada-g.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
  {
    sha: "wall-sample-8",
    name: "Seraphic Flame Wings",
    width: 2160,
    height: 3840,
    preview_url: "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/ryomen-sukuna-skulls.webp",
    download_url: "https://raw.githubusercontent.com/not-ayan/storage/main/main/ryomen-sukuna-skulls.png",
    resolution: "4K UHD",
    tag: "Mobile",
    platform: "Mobile",
    uploadDate: new Date(),
  },
]

export default function ProfileClient() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const { favorites } = useFavorites()

  // Origin for sharing
  const [origin, setOrigin] = useState("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  // User details
  const username = user?.username || "curator"
  const displayName = user?.fullName || user?.firstName || username || "Curator"
  const shareUrl = origin ? `${origin}/share/${username}` : `https://wallwidgy.xyz/share/${username}`
  const displayUrl = `wallwidgy.app/share/${username}`
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
      new Date(user.createdAt)
    )
    : "Jan 2026"

  // Clipboard copy state
  const [copied, setCopied] = useState(false)
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      setCopied(true)
      showSakugaToast("Profile link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy share link:", err)
    }
  }

  // Per-user storage keys
  const userId = user?.id
  const setupsStorageKey = userId ? `wallwidgy_setups_${userId}` : "wallwidgy_setups_guest"
  const backdropStorageKey = userId ? `wallwidgy_profile_backdrop_${userId}` : "wallwidgy_profile_backdrop_guest"

  // 1. Profile Backdrop State (strictly per-user)
  const [backdropUrl, setBackdropUrl] = useState<string>(DEFAULT_BACKDROP)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(backdropStorageKey)
      if (stored) {
        setBackdropUrl(stored)
      } else {
        setBackdropUrl(DEFAULT_BACKDROP)
      }
    }
  }, [backdropStorageKey])

  const updateBackdrop = (url: string) => {
    setBackdropUrl(url)
    if (typeof window !== "undefined") {
      localStorage.setItem(backdropStorageKey, url)
    }
    if (isSignedIn && userId) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backdrop: url }),
      }).catch((err) => console.warn("Failed to persist backdrop to server:", err))
    }
    showSakugaToast("Profile backdrop updated")
  }

  // 2. Setups State (per-user, max 4, NO preloaded setups)
  const [setups, setSetups] = useState<Setup[]>([])
  const [activeSetupIndex, setActiveSetupIndex] = useState<number>(0)
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [editingNameValue, setEditingNameValue] = useState<string>("")

  // Load setups scoped to user
  useEffect(() => {
    if (!isLoaded) return

    let isMounted = true

    // Step A: Read local cached setups for this specific user
    let initialLocalSetups: Setup[] = []
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(setupsStorageKey)
      if (local) {
        try {
          const parsed = JSON.parse(local)
          if (Array.isArray(parsed)) {
            initialLocalSetups = parsed.slice(0, MAX_SETUPS)
          }
        } catch (e) {
          console.error("Failed to parse cached setups:", e)
        }
      }
    }

    if (isMounted) {
      setSetups(initialLocalSetups)
      setActiveSetupIndex(0)
    }

    // Step B: If user is signed in, synchronize with Clerk via /api/profile and /api/setups
    if (isSignedIn && userId) {
      // Sync profile metadata (backdrop)
      fetch("/api/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((profileData) => {
          if (!isMounted || !profileData) return
          if (profileData.backdrop) {
            setBackdropUrl(profileData.backdrop)
            if (typeof window !== "undefined") {
              localStorage.setItem(backdropStorageKey, profileData.backdrop)
            }
          }
        })
        .catch((err) => console.warn("Could not sync profile metadata:", err))

      fetch("/api/setups")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted || !data) return
          if (Array.isArray(data.setups)) {
            const serverSetups: Setup[] = data.setups.slice(0, MAX_SETUPS)
            if (serverSetups.length > 0) {
              setSetups(serverSetups)
              if (typeof window !== "undefined") {
                localStorage.setItem(setupsStorageKey, JSON.stringify(serverSetups))
              }
            } else if (initialLocalSetups.length > 0) {
              // Local had setups but server was empty (e.g. freshly authenticated), sync to server
              fetch("/api/setups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ setups: initialLocalSetups }),
              }).catch((err) => console.warn("Failed to sync initial setups to server:", err))
            }
          }
        })
        .catch((err) => {
          console.warn("Could not fetch user setups from server:", err)
        })
    }

    return () => {
      isMounted = false
    }
  }, [isLoaded, isSignedIn, userId, setupsStorageKey, backdropStorageKey])

  // Persist setups to local storage and Clerk cloud metadata
  const persistSetups = (newSetups: Setup[]) => {
    const capped = newSetups.slice(0, MAX_SETUPS)
    setSetups(capped)

    if (typeof window !== "undefined") {
      localStorage.setItem(setupsStorageKey, JSON.stringify(capped))
    }

    if (isSignedIn && userId) {
      fetch("/api/setups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setups: capped }),
      }).catch((err) => {
        console.error("Failed to persist setups to server:", err)
      })
    }
  }

  // Active setup reference
  const currentSetup = setups[activeSetupIndex] || null

  // Add a new empty setup (enforcing max 4 limit)
  const handleAddNewSetup = () => {
    if (setups.length >= MAX_SETUPS) {
      showSakugaToast(`Maximum limit of ${MAX_SETUPS} setups reached`)
      return
    }

    const nextIndex = setups.length + 1
    const newSetup: Setup = {
      id: `setup-${Date.now()}-${nextIndex}`,
      name: `Setup ${nextIndex}`,
      homescreen: null,
      lockscreen: null,
    }

    const updated = [...setups, newSetup]
    persistSetups(updated)
    setActiveSetupIndex(updated.length - 1)
    setIsEditingName(false)
    showSakugaToast(`Created Setup ${nextIndex}`)
  }

  // Delete setup
  const handleDeleteSetup = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    const target = setups[index]
    const updated = setups.filter((_, i) => i !== index)
    persistSetups(updated)
    if (activeSetupIndex >= updated.length) {
      setActiveSetupIndex(Math.max(0, updated.length - 1))
    }
    setIsEditingName(false)
    showSakugaToast(`Deleted ${target?.name || "setup"}`)
  }

  // Inline rename setup
  const handleStartRename = () => {
    if (!currentSetup) return
    setEditingNameValue(currentSetup.name)
    setIsEditingName(true)
  }

  const handleSaveRename = () => {
    if (!currentSetup) return
    const trimmed = editingNameValue.trim()
    if (!trimmed) {
      setIsEditingName(false)
      return
    }
    const updated = [...setups]
    updated[activeSetupIndex] = {
      ...updated[activeSetupIndex],
      name: trimmed,
    }
    persistSetups(updated)
    setIsEditingName(false)
    showSakugaToast(`Renamed to "${trimmed}"`)
  }

  // Clear specific slot in current setup
  const handleClearSlot = (e: React.MouseEvent, slot: "homescreen" | "lockscreen") => {
    e.stopPropagation()
    if (!currentSetup) return
    const updated = [...setups]
    updated[activeSetupIndex] = {
      ...updated[activeSetupIndex],
      [slot]: null,
    }
    persistSetups(updated)
    showSakugaToast(`Removed ${slot === "homescreen" ? "homescreen" : "lockscreen"} wallpaper`)
  }

  // 3. Store Wallpapers Query (for Picker & Favorites)
  const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([])
  const [isWallpapersLoading, setIsWallpapersLoading] = useState(false)
  useEffect(() => {
    let mounted = true
    setIsWallpapersLoading(true)
    getParsedWallpapers()
      .then(({ wallpapers }) => {
        if (mounted && wallpapers && wallpapers.length > 0) {
          setAllWallpapers(wallpapers)
        }
      })
      .catch((err) => {
        console.warn("Could not load wallpaper index for profile:", err)
      })
      .finally(() => {
        if (mounted) setIsWallpapersLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Resolve user favorites strictly matching their actual saved favorites
  const favouriteWalls = useMemo(() => {
    if (!favorites || favorites.length === 0 || allWallpapers.length === 0) {
      return []
    }

    const favItems: Wallpaper[] = []
    for (const favId of favorites) {
      const found = allWallpapers.find(
        (w) => isIdMatching(favId, w.sha) || isIdMatching(favId, w.name)
      )
      if (found && !favItems.some((item) => item.sha === found.sha)) {
        favItems.push(found)
      }
    }
    return favItems.slice(0, 8)
  }, [favorites, allWallpapers])

  // 4. Modal Picker State (For Backdrop, Home Wallpaper, or Lockscreen Wallpaper)
  const [pickerTarget, setPickerTarget] = useState<"backdrop" | "homescreen" | "lockscreen" | null>(null)
  const [pickerCustomUrl, setPickerCustomUrl] = useState("")
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerFilter, setPickerFilter] = useState<"all" | "mobile" | "desktop" | "favorites">("all")
  const [pickerVisibleCount, setPickerVisibleCount] = useState(60)
  const pickerSentinelRef = useRef<HTMLDivElement | null>(null)

  const openPicker = (target: "backdrop" | "homescreen" | "lockscreen") => {
    setPickerTarget(target)
    setPickerCustomUrl("")
    setPickerSearch("")
    setPickerFilter("all")
    setPickerVisibleCount(60)
  }

  // Filtered Wallpapers for the Picker Modal
  const filteredPickerWallpapers = useMemo(() => {
    const list = allWallpapers.length > 0 ? allWallpapers : CURATED_SAMPLE_WALLS

    return list.filter((w) => {
      // Tab filter
      if (pickerFilter === "mobile" && w.platform !== "Mobile") return false
      if (pickerFilter === "desktop" && w.platform !== "Desktop") return false
      if (pickerFilter === "favorites") {
        const isFav = favorites.some((favId) => isIdMatching(favId, w.sha) || isIdMatching(favId, w.name))
        if (!isFav) return false
      }

      // Search query
      if (!pickerSearch.trim()) return true
      const query = pickerSearch.toLowerCase().trim()
      const matchesName = w.name.toLowerCase().includes(query)
      const matchesCategory = w.category?.toLowerCase().includes(query)
      const matchesPlatform = w.platform?.toLowerCase().includes(query)
      return matchesName || matchesCategory || matchesPlatform
    })
  }, [allWallpapers, pickerFilter, favorites, pickerSearch])

  // Wallpaper category and count breakdown for the picker
  const pickerCounts = useMemo(() => {
    const list = allWallpapers.length > 0 ? allWallpapers : CURATED_SAMPLE_WALLS
    let mobile = 0
    let desktop = 0
    let favCount = 0

    for (const w of list) {
      if (w.platform === "Mobile") mobile++
      if (w.platform === "Desktop") desktop++
      if (favorites.some((favId) => isIdMatching(favId, w.sha) || isIdMatching(favId, w.name))) {
        favCount++
      }
    }

    return { total: list.length, mobile, desktop, favCount }
  }, [allWallpapers, favorites])

  // Sentinel IntersectionObserver for infinite scrolling inside the modal
  useEffect(() => {
    if (!pickerTarget) return
    const el = pickerSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPickerVisibleCount((prev) => Math.min(prev + 60, filteredPickerWallpapers.length))
        }
      },
      { rootMargin: "300px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pickerTarget, filteredPickerWallpapers.length])

  const applySelectedWallpaper = (item: { name?: string; previewUrl: string; id?: string }) => {
    if (!pickerTarget) return

    if (pickerTarget === "backdrop") {
      updateBackdrop(item.previewUrl)
    } else if (pickerTarget === "homescreen") {
      if (setups.length === 0) {
        // Automatically initialize Setup 1 if no setup exists yet
        const newSetup: Setup = {
          id: `setup-${Date.now()}`,
          name: "Setup 1",
          homescreen: {
            id: item.id || item.name || "home",
            name: item.name || "Home Wallpaper",
            previewUrl: item.previewUrl,
          },
          lockscreen: null,
        }
        persistSetups([newSetup])
        setActiveSetupIndex(0)
        showSakugaToast("Homescreen wallpaper set")
      } else {
        const updated = [...setups]
        const current = updated[activeSetupIndex]
        if (current) {
          updated[activeSetupIndex] = {
            ...current,
            homescreen: {
              id: item.id || item.name || "home",
              name: item.name || "Home Wallpaper",
              previewUrl: item.previewUrl,
            },
          }
          persistSetups(updated)
          showSakugaToast("Homescreen wallpaper updated")
        }
      }
    } else if (pickerTarget === "lockscreen") {
      if (setups.length === 0) {
        // Automatically initialize Setup 1 if no setup exists yet
        const newSetup: Setup = {
          id: `setup-${Date.now()}`,
          name: "Setup 1",
          homescreen: null,
          lockscreen: {
            id: item.id || item.name || "lock",
            name: item.name || "Lockscreen Wallpaper",
            previewUrl: item.previewUrl,
          },
        }
        persistSetups([newSetup])
        setActiveSetupIndex(0)
        showSakugaToast("Lockscreen wallpaper set")
      } else {
        const updated = [...setups]
        const current = updated[activeSetupIndex]
        if (current) {
          updated[activeSetupIndex] = {
            ...current,
            lockscreen: {
              id: item.id || item.name || "lock",
              name: item.name || "Lockscreen Wallpaper",
              previewUrl: item.previewUrl,
            },
          }
          persistSetups(updated)
          showSakugaToast("Lockscreen wallpaper updated")
        }
      }
    }

    setPickerTarget(null)
  }

  // 5. Selected Wallpaper for Full Inspection Modal
  const [inspectedWallpaper, setInspectedWallpaper] = useState<Wallpaper | null>(null)

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white font-outfit selection:bg-[var(--accent-light)] selection:text-black">
      {/* Universal Consistent Header */}
      <Header showBackButton={true} backUrl="/" />

      {/* Main Grid Wrapper */}
      <div className="pt-24 sm:pt-28 pb-20 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8">

        {/* 3-Column Studio Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ======================================================== */}
          {/* COLUMN 1: Profile & Identity Card                        */}
          {/* ======================================================== */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col justify-between bg-[#121212] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl relative group min-h-[520px]">

            {/* Studio Backdrop System (Full Card Coverage, Seamless Gradient Dissolve) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
              {/* Base Wallpaper with Deep Cinematic Dimming */}
              <img
                src={backdropUrl}
                alt="Profile Backdrop"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-[0.55] contrast-[1.08]"
              />

              {/* Ambient Darkening Overlay */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />

              {/* Progressive Scrim Dissolve directly into #121212 */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(18,18,18,0.35) 0%, rgba(18,18,18,0.55) 25%, rgba(18,18,18,0.8) 50%, rgba(18,18,18,0.96) 75%, #121212 98%)",
                }}
              />
            </div>

            {/* Change Backdrop Action Pill */}
            <button
              onClick={() => openPicker("backdrop")}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-lg opacity-90 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Change backdrop wallpaper"
            >
              <Camera className="w-3.5 h-3.5 text-[var(--accent-light)]" />
              <span>Change Backdrop</span>
            </button>

            {/* Profile Identity Body (Flows naturally over the backdrop) */}
            <div className="relative z-10 px-6 pb-6 pt-28 sm:pt-36 flex-1 flex flex-col justify-end">
              <div>
                {/* Squircle Avatar Overlap with subtle glow ring */}
                <div className="mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-[#121212] bg-[#141414] shadow-2xl shrink-0 border border-white/10 aspect-square">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#1E1E1E] to-[#2D2D2D]">
                      <UserIcon className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                </div>

                {/* Display Name */}
                <h1 className="font-aspekta text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
                  {displayName}
                </h1>

                {/* Handle & Join Date */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40 font-mono tracking-wider">
                  <span>@{username}</span>
                  <span>&bull;</span>
                  <span>Joined {memberSince}</span>
                </div>

                {/* Public Profile Link Pill */}
                <div className="mt-5 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-white/40 font-mono">Profile:</span>
                    <span className="text-white/80 truncate font-mono text-[11px]">
                      {displayUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy public profile link"
                      aria-label="Copy link"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Link
                      href={shareUrl}
                      target="_blank"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Open public profile"
                      aria-label="Open profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => openUserProfile()}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-white/80 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-white/60" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUMN 2: Favourite Walls Card                           */}
          {/* ======================================================== */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col justify-between bg-[#121212] border border-white/[0.08] rounded-3xl p-6 shadow-2xl min-h-0 xl:min-h-[520px]">

            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-3.5 sm:mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="font-aspekta text-base sm:text-lg font-medium text-white tracking-tight">
                    Favourite Walls
                  </h2>
                  {favorites && favorites.length > 0 && (
                    <span className="text-[10px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </div>
                <Link
                  href="/favorites"
                  className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 group font-mono"
                >
                  <span>Show All</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {/* Grid content: Loading, Populated, or Empty */}
              {allWallpapers.length === 0 && favorites && favorites.length > 0 ? (
                /* Loading skeletons while wallpaper catalog resolves */
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
                  {Array.from({ length: Math.min(favorites.length, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[9/16] rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
                    />
                  ))}
                </div>
              ) : favouriteWalls.length > 0 ? (
                /* 2x4 Thumbnail Grid (Top 8 Wallpapers) */
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
                  {favouriteWalls.map((wall, index) => (
                    <div
                      key={wall.sha || index}
                      onClick={() => setInspectedWallpaper(wall)}
                      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-[var(--accent-light)]/40 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.03]"
                      title={wall.name.replace(/\.[^/.]+$/, "")}
                    >
                      <img
                        src={wall.preview_url}
                        alt={wall.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />

                      {/* Hover Glow Mask */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[9px] text-white/90 truncate font-mono">
                          {wall.name.replace(/\.[^/.]+$/, "")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Aesthetic Empty State */
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 text-white/30">
                    <Heart className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-white/70">No favorite wallpapers yet</p>
                  <p className="text-xs text-white/40 mt-1 max-w-[200px]">
                    Heart wallpapers across the site to showcase them here
                  </p>
                  <Link
                    href="/"
                    className="mt-4 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white/80 hover:text-white border border-white/10 transition-colors"
                  >
                    Explore Wallpapers
                  </Link>
                </div>
              )}
            </div>

            {/* Footer More Count */}
            {favorites && favorites.length > 8 && (
              <div className="flex justify-end pt-3 sm:pt-4 mt-3 sm:mt-auto">
                <Link
                  href="/favorites"
                  className="text-xs font-mono text-white/40 hover:text-[var(--accent-light)] transition-colors"
                >
                  +{favorites.length - favouriteWalls.length} More
                </Link>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* COLUMN 3: Setups Showcase Card (Per-User, Max 4)          */}
          {/* ======================================================== */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col justify-between bg-[#121212] border border-white/[0.08] rounded-3xl p-6 shadow-2xl min-h-0 xl:min-h-[520px]">

            {/* Header Section */}
            <div>
              <div className="flex items-center justify-between mb-3.5 sm:mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-aspekta text-base sm:text-lg font-medium text-white tracking-tight">
                    Setups
                  </h2>

                  {currentSetup && (
                    <>
                      {isEditingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename()
                              if (e.key === "Escape") setIsEditingName(false)
                            }}
                            autoFocus
                            className="text-[11px] font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-[var(--accent-light)]/60 focus:outline-none w-28"
                            maxLength={24}
                          />
                          <button
                            onClick={handleSaveRename}
                            className="p-1 rounded hover:bg-white/10 text-emerald-400"
                            title="Save Name"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartRename}
                          className="group/name flex items-center gap-1.5 text-[10px] font-mono text-white/70 hover:text-white uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                          title="Click to rename this setup"
                        >
                          <span>{currentSetup.name}</span>
                          <Pencil className="w-2.5 h-2.5 opacity-40 group-hover/name:opacity-100 transition-opacity" />
                        </button>
                      )}

                      <span className="text-[10px] font-mono text-white/30">
                        ({activeSetupIndex + 1}/{setups.length})
                      </span>
                    </>
                  )}

                  {setups.length === 0 && (
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      0 / {MAX_SETUPS}
                    </span>
                  )}
                </div>

                {/* New Setup Button - hidden if limit of 4 reached */}
                {setups.length < MAX_SETUPS && (
                  <button
                    onClick={handleAddNewSetup}
                    className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 group"
                    title={`Create a new setup (${setups.length}/${MAX_SETUPS})`}
                  >
                    <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>New</span>
                  </button>
                )}
              </div>

              {/* Main Setup Display Area */}
              {setups.length === 0 ? (
                /* Elegant Zero-State: No setups configured yet */
                <div className="bg-[#0B0B0B] border border-dashed border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-inner my-2">
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="w-14 h-24 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center -rotate-6 transform -mr-4 text-white/20">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="w-14 h-24 rounded-2xl border border-dashed border-[var(--accent-light)]/40 bg-[var(--accent-light)]/[0.04] flex items-center justify-center rotate-6 transform z-10 text-[var(--accent-light)]/70 shadow-lg">
                      <Smartphone className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="font-aspekta text-base font-medium text-white tracking-tight">
                    No setups created yet
                  </h3>
                  <p className="text-white/40 text-xs mt-1.5 max-w-xs leading-relaxed">
                    Curate up to {MAX_SETUPS} custom lockscreen and homescreen wallpaper pairings on your profile.
                  </p>

                  <button
                    onClick={handleAddNewSetup}
                    className="mt-6 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[var(--accent-light)]/50 text-white hover:text-[var(--accent-light)] text-xs font-mono font-medium transition-all flex items-center gap-2 shadow-lg group"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--accent-light)] group-hover:scale-110 transition-transform" />
                    <span>Create First Setup</span>
                  </button>
                </div>
              ) : (
                /* Elevated Dual Phone Display Stage */
                <div className="bg-[#0B0B0B] border border-white/[0.04] rounded-2xl p-3 xs:p-4 sm:p-5 flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 shadow-inner">

                  {/* 1. Home Phone Slot */}
                  <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    {currentSetup?.homescreen?.previewUrl ? (
                      <div
                        onClick={() => openPicker("homescreen")}
                        className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2.5px] sm:border-[3px] border-[#2A2A2A] bg-black overflow-hidden shadow-2xl cursor-pointer hover:border-[var(--accent-light)]/60 transition-all hover:scale-[1.02]"
                        title="Click to change Home wallpaper"
                      >
                        {/* Wallpaper Preview */}
                        <img
                          src={currentSetup.homescreen.previewUrl}
                          alt={currentSetup.homescreen.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Status Bar UI Overlay */}
                        <div className="absolute top-0 inset-x-0 pt-1.5 xs:pt-2 px-2.5 xs:px-3 flex items-center justify-between text-[6.5px] xs:text-[7px] font-mono text-white/80 pointer-events-none">
                          <span>9:41</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-black ring-1 ring-white/10 mx-auto" />
                          <div className="flex items-center gap-1">
                            <Wifi className="w-2 h-2 text-white/80" />
                            <Battery className="w-2.5 h-2.5 text-white/80" />
                          </div>
                        </div>

                        {/* Homescreen App Dock Placeholder */}
                        <div className="absolute bottom-2 xs:bottom-3 inset-x-1.5 xs:inset-x-2 py-1 xs:py-1.5 px-1.5 xs:px-2 rounded-xl xs:rounded-2xl bg-white/[0.12] backdrop-blur-md border border-white/10 flex items-center justify-between pointer-events-none">
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-md xs:rounded-lg bg-white/20" />
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-md xs:rounded-lg bg-white/20" />
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-md xs:rounded-lg bg-white/20" />
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-md xs:rounded-lg bg-[var(--accent-light)]/40" />
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <div className="flex items-center gap-1 text-[10px] font-mono text-white font-medium">
                            <Camera className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                            <span>Change</span>
                          </div>
                          <button
                            onClick={(e) => handleClearSlot(e, "homescreen")}
                            className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[9px] font-mono transition-colors"
                            title="Clear wallpaper"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty Homescreen Slot */
                      <div
                        onClick={() => openPicker("homescreen")}
                        className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2px] border-dashed border-white/20 hover:border-[var(--accent-light)]/80 bg-white/[0.02] hover:bg-white/[0.05] overflow-hidden shadow-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center p-3 text-center"
                        title="Click to select Home wallpaper"
                      >
                        <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-white/[0.04] group-hover:bg-[var(--accent-light)]/10 border border-white/10 group-hover:border-[var(--accent-light)]/40 flex items-center justify-center mb-2 xs:mb-2.5 transition-colors">
                          <Plus className="w-4 h-4 xs:w-5 xs:h-5 text-white/40 group-hover:text-[var(--accent-light)] transition-colors" />
                        </div>
                        <span className="text-[10px] xs:text-[11px] font-mono text-white/80 font-medium group-hover:text-white transition-colors">
                          Set Home Wall
                        </span>
                        <span className="text-[8.5px] xs:text-[9px] font-mono text-white/35 mt-0.5">
                          Click to choose
                        </span>
                      </div>
                    )}

                    <span className="text-[11px] sm:text-xs font-mono text-white/50 tracking-wider">
                      Home
                    </span>
                  </div>

                  {/* 2. Lockscreen Phone Slot */}
                  <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    {currentSetup?.lockscreen?.previewUrl ? (
                      <div
                        onClick={() => openPicker("lockscreen")}
                        className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2.5px] sm:border-[3px] border-[#2A2A2A] bg-black overflow-hidden shadow-2xl cursor-pointer hover:border-[var(--accent-light)]/60 transition-all hover:scale-[1.02]"
                        title="Click to change Lockscreen wallpaper"
                      >
                        {/* Wallpaper Preview */}
                        <img
                          src={currentSetup.lockscreen.previewUrl}
                          alt={currentSetup.lockscreen.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Top Punch Hole */}
                        <div className="absolute top-1.5 xs:top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black ring-1 ring-white/10 pointer-events-none" />

                        {/* Lockscreen Clock & Date Widget */}
                        <div className="absolute top-6 xs:top-8 inset-x-0 text-center pointer-events-none">
                          <span className="block text-[6.5px] xs:text-[7px] font-mono text-white/70 uppercase tracking-wider">
                            Thursday, Nov 20
                          </span>
                          <span className="block font-aspekta font-light text-lg xs:text-xl sm:text-2xl text-white/95 leading-none tracking-tight mt-0.5">
                            09:41
                          </span>
                        </div>

                        {/* Lockscreen Corner Shortcut Icons */}
                        <div className="absolute bottom-3 xs:bottom-4 inset-x-2.5 xs:inset-x-3 flex items-center justify-between text-white/70 pointer-events-none">
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <Flashlight className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-white/80" />
                          </div>
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <Camera className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-white/80" />
                          </div>
                        </div>

                        {/* Bottom Home Indicator Bar */}
                        <div className="absolute bottom-1 xs:bottom-1.5 left-1/2 -translate-x-1/2 w-8 xs:w-10 h-0.5 rounded-full bg-white/60 pointer-events-none" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <div className="flex items-center gap-1 text-[10px] font-mono text-white font-medium">
                            <Camera className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                            <span>Change</span>
                          </div>
                          <button
                            onClick={(e) => handleClearSlot(e, "lockscreen")}
                            className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[9px] font-mono transition-colors"
                            title="Clear wallpaper"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty Lockscreen Slot */
                      <div
                        onClick={() => openPicker("lockscreen")}
                        className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2px] border-dashed border-white/20 hover:border-[var(--accent-light)]/80 bg-white/[0.02] hover:bg-white/[0.05] overflow-hidden shadow-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center p-3 text-center"
                        title="Click to select Lockscreen wallpaper"
                      >
                        <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-white/[0.04] group-hover:bg-[var(--accent-light)]/10 border border-white/10 group-hover:border-[var(--accent-light)]/40 flex items-center justify-center mb-2 xs:mb-2.5 transition-colors">
                          <Plus className="w-4 h-4 xs:w-5 xs:h-5 text-white/40 group-hover:text-[var(--accent-light)] transition-colors" />
                        </div>
                        <span className="text-[10px] xs:text-[11px] font-mono text-white/80 font-medium group-hover:text-white transition-colors">
                          Set Lock Wall
                        </span>
                        <span className="text-[8.5px] xs:text-[9px] font-mono text-white/35 mt-0.5">
                          Click to choose
                        </span>
                      </div>
                    )}

                    <span className="text-[11px] sm:text-xs font-mono text-white/50 tracking-wider">
                      Lockscreen
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Setup Switcher Circles (Active / Passive Indicators, Ceiling of 4) */}
            {setups.length > 0 ? (
              <div className="pt-3.5 sm:pt-5 mt-3 sm:mt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  {setups.map((setup, idx) => {
                    const isActive = idx === activeSetupIndex
                    return (
                      <button
                        key={setup.id}
                        onClick={() => {
                          setActiveSetupIndex(idx)
                          setIsEditingName(false)
                        }}
                        className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full transition-all duration-300 flex items-center justify-center group ${isActive
                          ? "bg-white text-black shadow-lg shadow-white/20 ring-4 ring-white/20 scale-105"
                          : "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white ring-1 ring-white/10"
                          }`}
                        title={`${setup.name} (Click to switch)`}
                        aria-label={`Switch to ${setup.name}`}
                      >
                        <span className="font-mono text-xs font-semibold">
                          {idx + 1}
                        </span>

                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-light)] ring-2 ring-[#121212]" />
                        )}
                      </button>
                    )
                  })}

                  {/* Add Setup Circle - strictly limited to MAX_SETUPS (4) */}
                  {setups.length < MAX_SETUPS && (
                    <button
                      onClick={handleAddNewSetup}
                      className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full border border-dashed border-white/20 hover:border-white/50 bg-white/[0.02] hover:bg-white/[0.08] text-white/40 hover:text-white flex items-center justify-center transition-all"
                      title={`Add another setup (${setups.length}/${MAX_SETUPS})`}
                      aria-label="Add setup"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                {/* Delete Current Setup */}
                <button
                  onClick={(e) => handleDeleteSetup(e, activeSetupIndex)}
                  className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete this setup"
                  aria-label="Delete setup"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40 font-mono">
                <span>0 of {MAX_SETUPS} setups active</span>
                <button
                  onClick={handleAddNewSetup}
                  className="px-3 py-1.5 rounded-full border border-dashed border-white/20 hover:border-white/50 bg-white/[0.02] hover:bg-white/[0.08] text-white/60 hover:text-white flex items-center gap-1.5 transition-all text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Setup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* WALLPAPER PICKER MODAL (For Backdrop / Home / Lockscreen) */}
      {/* ======================================================== */}
      {pickerTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPickerTarget(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="font-aspekta text-lg font-medium text-white tracking-tight">
                  {pickerTarget === "backdrop"
                    ? "Select Profile Backdrop"
                    : pickerTarget === "homescreen"
                      ? "Select Homescreen Wallpaper"
                      : "Select Lockscreen Wallpaper"}
                </h3>
                <p className="text-white/40 text-xs mt-0.5">
                  Pick from all {pickerCounts.total > 0 ? `${pickerCounts.total.toLocaleString()} wallpapers` : "wallpapers"} or paste any image URL
                </p>
              </div>

              <button
                onClick={() => setPickerTarget(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom URL Input Section */}
            <div className="pt-4 pb-3">
              <label className="block text-xs font-mono text-white/50 uppercase tracking-wider mb-2">
                Paste Image / Wallpaper URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://cdn.jsdelivr.net/... or any image URL"
                  value={pickerCustomUrl}
                  onChange={(e) => setPickerCustomUrl(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-light)] transition-colors font-mono"
                />
                <button
                  disabled={!pickerCustomUrl.trim()}
                  onClick={() =>
                    applySelectedWallpaper({
                      name: "Custom Wallpaper",
                      previewUrl: pickerCustomUrl.trim(),
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Filter Controls: Tabs & Search */}
            <div className="py-2 space-y-2.5">
              {/* Category / Platform Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => {
                    setPickerFilter("all")
                    setPickerVisibleCount(60)
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    pickerFilter === "all"
                      ? "bg-white text-black"
                      : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      pickerFilter === "all" ? "bg-black/15 text-black" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {pickerCounts.total.toLocaleString()}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPickerFilter("mobile")
                    setPickerVisibleCount(60)
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    pickerFilter === "mobile"
                      ? "bg-white text-black"
                      : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
                >
                  <span>Mobile</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      pickerFilter === "mobile" ? "bg-black/15 text-black" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {pickerCounts.mobile.toLocaleString()}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPickerFilter("desktop")
                    setPickerVisibleCount(60)
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    pickerFilter === "desktop"
                      ? "bg-white text-black"
                      : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
                >
                  <span>Desktop</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      pickerFilter === "desktop" ? "bg-black/15 text-black" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {pickerCounts.desktop.toLocaleString()}
                  </span>
                </button>

                {pickerCounts.favCount > 0 && (
                  <button
                    onClick={() => {
                      setPickerFilter("favorites")
                      setPickerVisibleCount(60)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                      pickerFilter === "favorites"
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                  >
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    <span>Favorites</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        pickerFilter === "favorites" ? "bg-black/15 text-black" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {pickerCounts.favCount}
                    </span>
                  </button>
                )}
              </div>

              {/* Search bar + count */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search all walls by name or category..."
                    value={pickerSearch}
                    onChange={(e) => {
                      setPickerSearch(e.target.value)
                      setPickerVisibleCount(60)
                    }}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  {pickerSearch && (
                    <button
                      onClick={() => setPickerSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-white/40 shrink-0 px-1">
                  {filteredPickerWallpapers.length.toLocaleString()}{" "}
                  {filteredPickerWallpapers.length === 1 ? "wall" : "walls"}
                </div>
              </div>
            </div>

            {/* Gallery Grid Picker with Infinite Scroll */}
            <div
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
                if (scrollTop + clientHeight >= scrollHeight - 300) {
                  setPickerVisibleCount((prev) => Math.min(prev + 60, filteredPickerWallpapers.length))
                }
              }}
              className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar"
            >
              {isWallpapersLoading && allWallpapers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-white/40">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-mono">Loading full wallpaper collection...</span>
                </div>
              ) : filteredPickerWallpapers.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-1.5 text-center text-white/40">
                  <p className="text-sm">No wallpapers found</p>
                  <p className="text-xs text-white/30">Try a different search or filter</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filteredPickerWallpapers.slice(0, pickerVisibleCount).map((wall) => (
                      <div
                        key={wall.sha}
                        onClick={() =>
                          applySelectedWallpaper({
                            id: wall.sha,
                            name: wall.name,
                            previewUrl: wall.preview_url,
                          })
                        }
                        className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-[var(--accent-light)] cursor-pointer transition-all hover:scale-[1.03]"
                      >
                        <img
                          src={wall.preview_url}
                          alt={wall.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center gap-1">
                          <span className="text-[10px] font-mono text-white font-medium line-clamp-2 px-1">
                            {wall.name.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "")}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-black text-[9px] font-bold uppercase tracking-wider">
                            Select
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Infinite Scroll Sentinel */}
                  <div ref={pickerSentinelRef} className="h-4 w-full" />

                  {/* Manual Load More fallback */}
                  {pickerVisibleCount < filteredPickerWallpapers.length && (
                    <div className="py-4 text-center">
                      <button
                        onClick={() =>
                          setPickerVisibleCount((prev) =>
                            Math.min(prev + 60, filteredPickerWallpapers.length)
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-white/70 hover:text-white transition-colors border border-white/10"
                      >
                        Load More ({filteredPickerWallpapers.length - pickerVisibleCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* WALLPAPER DETAIL MODAL (For Inspecting Favorite Walls)    */}
      {/* ======================================================== */}
      {inspectedWallpaper && (
        <WallpaperModal
          isOpen={true}
          wallpaper={{
            sha: inspectedWallpaper.sha,
            name: inspectedWallpaper.name,
            preview_url: inspectedWallpaper.preview_url,
            download_url: inspectedWallpaper.download_url,
            resolution: inspectedWallpaper.resolution,
            platform: inspectedWallpaper.platform,
            width: inspectedWallpaper.width,
            height: inspectedWallpaper.height,
          }}
          onClose={() => setInspectedWallpaper(null)}
        />
      )}

      {/* Footer & Back to Top */}
      <Footer />
      <BackToTop />
    </main>
  )
}
