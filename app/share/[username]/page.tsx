"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
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
  Heart,
  Smartphone,
  Eye,
  Flashlight,
  Wifi,
  Battery,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  X,
  Search,
  ArrowRight,
} from "lucide-react"

interface SetupItem {
  id?: string
  name: string
  previewUrl: string
  downloadUrl?: string
}

interface Setup {
  id: string
  name: string
  homescreen?: SetupItem | null
  lockscreen?: SetupItem | null
}

interface SharedProfile {
  username: string
  displayName: string
  imageUrl?: string
  createdAt?: string | number
  backdrop?: string | null
  setups: Setup[]
  favorites: string[]
  favoritesCount: number
}

const DEFAULT_BACKDROP = "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/monochrome-mountain-landscape.webp"

export default function SharedProfilePage() {
  const params = useParams()
  const username = params?.username as string

  const [profile, setProfile] = useState<SharedProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wallpaper catalog
  const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([])
  useEffect(() => {
    let mounted = true
    getParsedWallpapers()
      .then(({ wallpapers }) => {
        if (mounted && wallpapers && wallpapers.length > 0) {
          setAllWallpapers(wallpapers)
        }
      })
      .catch((err) => {
        console.warn("Could not load wallpapers for shared profile:", err)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Fetch shared profile by username
  useEffect(() => {
    if (!username) return

    let mounted = true
    setIsLoading(true)
    setError(null)

    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error("User not found")
        }
        if (!res.ok) {
          // Fallback to legacy favorites endpoint if needed
          const fallbackRes = await fetch(`/api/favorites/${encodeURIComponent(username)}`)
          if (fallbackRes.ok) {
            return fallbackRes.json()
          }
          throw new Error("Failed to load profile")
        }
        return res.json()
      })
      .then((data: any) => {
        if (!mounted) return
        setProfile({
          username: data.username || username,
          displayName: data.displayName || data.username || username,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
          backdrop: data.backdrop || null,
          setups: Array.isArray(data.setups) ? data.setups : [],
          favorites: Array.isArray(data.favorites) ? data.favorites : [],
          favoritesCount: typeof data.favoritesCount === "number" ? data.favoritesCount : (data.favorites?.length || 0),
        })
      })
      .catch((err) => {
        if (!mounted) return
        console.error("Error loading shared profile:", err)
        setError(err.message === "User not found" ? "User not found" : "Failed to load profile")
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [username])

  // Active Setup State in Showcase
  const [activeSetupIndex, setActiveSetupIndex] = useState<number>(0)
  const currentSetup = profile?.setups && profile.setups.length > 0 ? profile.setups[activeSetupIndex] || profile.setups[0] : null

  // Resolve Curator's Favourite Wallpapers from catalog using robust matching
  const resolvedFavourites = useMemo(() => {
    if (!profile || !profile.favorites) return []

    const resolved: Wallpaper[] = []
    profile.favorites.forEach((favId) => {
      const match = allWallpapers.find(
        (w) => isIdMatching(favId, w.sha) || isIdMatching(favId, w.name)
      )
      if (match) {
        if (!resolved.some((r) => r.sha === match.sha)) {
          resolved.push(match)
        }
      } else {
        // Construct fallback wallpaper item if not yet indexed
        resolved.push({
          sha: favId,
          name: favId.replace(/\.[^/.]+$/, "").replace(/-/g, " "),
          preview_url: `https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/${favId}.webp`,
          download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${favId}.png`,
          resolution: "4K UHD",
          platform: "Mobile",
          tag: "Mobile",
          uploadDate: new Date(),
          width: 2160,
          height: 3840,
        })
      }
    })
    return resolved
  }, [profile, allWallpapers])

  // Wallpaper Inspection Modal State
  const [inspectedWallpaper, setInspectedWallpaper] = useState<Wallpaper | null>(null)

  // Full Favorites View Modal State
  const [showAllFavorites, setShowAllFavorites] = useState(false)
  const [favoritesSearch, setFavoritesSearch] = useState("")

  // Origin for sharing
  const [origin, setOrigin] = useState("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const shareUrl = origin ? `${origin}/share/${username}` : `https://wallwidgy.xyz/share/${username}`
  const displayUrl = `wallwidgy.app/share/${username}`

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

  // Format member since date
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
      new Date(profile.createdAt)
    )
    : "Jan 2026"

  // Open modal for setup phone wallpaper
  const openSetupWallpaper = (item?: SetupItem | null) => {
    if (!item?.previewUrl) return
    const matched = allWallpapers.find(
      (w) => w.preview_url === item.previewUrl || w.sha === item.id || w.name === item.name
    )
    if (matched) {
      setInspectedWallpaper(matched)
    } else {
      setInspectedWallpaper({
        sha: item.id || `wall-${Date.now()}`,
        name: item.name || "Curated Wallpaper",
        preview_url: item.previewUrl,
        download_url: item.downloadUrl || item.previewUrl,
        resolution: "4K UHD",
        platform: "Mobile",
        tag: "Mobile",
        uploadDate: new Date(),
        width: 2160,
        height: 3840,
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white font-outfit selection:bg-[var(--accent-light)] selection:text-black">
      {/* Universal Consistent Header */}
      <Header showBackButton={true} backUrl="/" />

      {/* Main Grid Wrapper */}
      <div className="pt-24 sm:pt-28 pb-20 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-8 h-8 text-[var(--accent-light)] animate-spin" />
            <p className="text-white/40 font-mono text-xs tracking-wider">
              Loading curator profile...
            </p>
          </div>
        ) : error || !profile ? (
          /* Error / User Not Found State */
          <div className="max-w-md mx-auto text-center py-32 bg-[#121212] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-aspekta text-2xl font-semibold text-white tracking-tight">
              {error === "User not found" ? "Curator Not Found" : "Profile Unavailable"}
            </h2>
            <p className="text-white/40 text-xs sm:text-sm mt-2 mb-6 leading-relaxed">
              {error === "User not found"
                ? `The profile @${username} could not be found. It may have been renamed or does not exist.`
                : "Unable to load this profile right now. Please check back later."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-light)] text-black text-xs font-semibold hover:bg-[var(--accent-light)]/90 transition-all shadow-lg"
            >
              <span>Explore WallWidgy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* 3-Column Full Studio Profile Showcase */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* ======================================================== */}
            {/* COLUMN 1: Profile & Identity Card                        */}
            {/* ======================================================== */}
            <div className="lg:col-span-12 xl:col-span-4 flex flex-col justify-between bg-[#121212] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl relative group min-h-[520px]">

              {/* Studio Backdrop System (Full Card Coverage, Seamless Gradient Dissolve) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                {/* Base Wallpaper with Deep Cinematic Dimming */}
                <img
                  src={profile.backdrop || DEFAULT_BACKDROP}
                  alt={`${profile.displayName}'s Backdrop`}
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

              {/* Curator Badge */}
              <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[var(--accent-light)] text-xs font-mono font-medium flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curator</span>
              </div>

              {/* Profile Identity Body (Flows naturally over the backdrop) */}
              <div className="relative z-10 px-6 pb-6 pt-28 sm:pt-36 flex-1 flex flex-col justify-end">
                <div>
                  {/* Squircle Avatar Overlap with subtle glow ring */}
                  <div className="mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-[#121212] bg-[#141414] shadow-2xl shrink-0 border border-white/10 aspect-square">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.displayName}
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
                    {profile.displayName}
                  </h1>

                  {/* Handle & Join Date */}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40 font-mono tracking-wider">
                    <span>@{profile.username}</span>
                    <span>&bull;</span>
                    <span>Joined {memberSince}</span>
                  </div>

                  {/* Quick Profile Summary Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="block text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        Favorites
                      </span>
                      <span className="block font-aspekta text-lg font-semibold text-white mt-0.5">
                        {profile.favoritesCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="block text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        Setups
                      </span>
                      <span className="block font-aspekta text-lg font-semibold text-white mt-0.5">
                        {profile.setups.length}
                      </span>
                    </div>
                  </div>

                  {/* Public Profile Link Pill */}
                  <div className="mt-4 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
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
                        title="Copy profile link"
                        aria-label="Copy link"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Pill */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <Link
                    href="/"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-white/80 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <span>Explore Wallpaper Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/60" />
                  </Link>
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
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      {profile.favoritesCount}
                    </span>
                  </div>

                  {resolvedFavourites.length > 8 && (
                    <button
                      onClick={() => setShowAllFavorites(true)}
                      className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 group font-mono"
                    >
                      <span>Show All</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* 2x4 Thumbnail Grid (Top 8 Wallpapers) */}
                {resolvedFavourites.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
                    {resolvedFavourites.slice(0, 8).map((wall, index) => (
                      <div
                        key={wall.sha || index}
                        onClick={() => setInspectedWallpaper(wall)}
                        className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-[var(--accent-light)]/40 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.03]"
                        title={`Click to inspect ${wall.name}`}
                      >
                        <img
                          src={wall.preview_url}
                          alt={wall.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                          <span className="text-[9px] text-white/90 truncate font-mono">
                            {wall.name.replace(/\.[^/.]+$/, "")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Zero Favorites State */
                  <div className="bg-[#0B0B0B] border border-dashed border-white/[0.06] rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center my-6">
                    <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white/20 mb-3" />
                    <p className="text-white/60 text-xs font-mono">
                      No favorite wallpapers saved yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer More Count */}
              <div className="flex justify-end pt-3 sm:pt-4 mt-3 sm:mt-auto">
                {resolvedFavourites.length > 8 ? (
                  <button
                    onClick={() => setShowAllFavorites(true)}
                    className="text-xs font-mono text-white/40 hover:text-[var(--accent-light)] transition-colors"
                  >
                    +{resolvedFavourites.length - 8} More
                  </button>
                ) : (
                  <span className="text-xs font-mono text-white/30">
                    Curated by @{profile.username}
                  </span>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMN 3: Setups Showcase Card                           */}
            {/* ======================================================== */}
            <div className="lg:col-span-12 xl:col-span-4 flex flex-col justify-between bg-[#121212] border border-white/[0.08] rounded-3xl p-6 shadow-2xl min-h-0 xl:min-h-[520px]">

              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3.5 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-aspekta text-base sm:text-lg font-medium text-white tracking-tight">
                      Setups
                    </h2>
                    {currentSetup && (
                      <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                        {currentSetup.name}
                      </span>
                    )}
                  </div>

                  {profile.setups.length > 0 && (
                    <span className="text-[10px] font-mono text-white/30">
                      ({activeSetupIndex + 1}/{profile.setups.length})
                    </span>
                  )}
                </div>

                {/* Main Setup Display Area */}
                {profile.setups.length === 0 || !currentSetup ? (
                  /* Zero Setups State */
                  <div className="bg-[#0B0B0B] border border-dashed border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-inner my-2">
                    <div className="relative mb-5 flex items-center justify-center">
                      <div className="w-14 h-24 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center -rotate-6 transform -mr-4 text-white/20">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="w-14 h-24 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] flex items-center justify-center rotate-6 transform z-10 text-white/30 shadow-lg">
                        <Smartphone className="w-6 h-6" />
                      </div>
                    </div>

                    <h3 className="font-aspekta text-base font-medium text-white tracking-tight">
                      No setups published yet
                    </h3>
                    <p className="text-white/40 text-xs mt-1.5 max-w-xs leading-relaxed">
                      This curator hasn&apos;t created any lockscreen or homescreen setups yet.
                    </p>
                  </div>
                ) : (
                  /* Elevated Dual Phone Display Stage */
                  <div className="bg-[#0B0B0B] border border-white/[0.04] rounded-2xl p-3 xs:p-4 sm:p-5 flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 shadow-inner">

                    {/* 1. Home Phone Slot */}
                    <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                      {currentSetup.homescreen?.previewUrl ? (
                        <div
                          onClick={() => openSetupWallpaper(currentSetup.homescreen)}
                          className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2.5px] sm:border-[3px] border-[#2A2A2A] bg-black overflow-hidden shadow-2xl cursor-pointer hover:border-[var(--accent-light)]/60 transition-all hover:scale-[1.02]"
                          title="Click to view and download wallpaper"
                        >
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

                          {/* Hover View Action */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-center p-2">
                            <Eye className="w-4 h-4 text-[var(--accent-light)]" />
                            <span className="text-[10px] font-mono text-white font-medium">
                              View Wallpaper
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2px] border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center text-white/30">
                          <span className="text-[10px] font-mono">Unset</span>
                        </div>
                      )}

                      <span className="text-[11px] sm:text-xs font-mono text-white/50 tracking-wider">
                        Home
                      </span>
                    </div>

                    {/* 2. Lockscreen Phone Slot */}
                    <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                      {currentSetup.lockscreen?.previewUrl ? (
                        <div
                          onClick={() => openSetupWallpaper(currentSetup.lockscreen)}
                          className="group relative aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2.5px] sm:border-[3px] border-[#2A2A2A] bg-black overflow-hidden shadow-2xl cursor-pointer hover:border-[var(--accent-light)]/60 transition-all hover:scale-[1.02]"
                          title="Click to view and download wallpaper"
                        >
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
                              <Eye className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-white/80" />
                            </div>
                          </div>

                          {/* Bottom Home Indicator Bar */}
                          <div className="absolute bottom-1 xs:bottom-1.5 left-1/2 -translate-x-1/2 w-8 xs:w-10 h-0.5 rounded-full bg-white/60 pointer-events-none" />

                          {/* Hover View Action */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-center p-2">
                            <Eye className="w-4 h-4 text-[var(--accent-light)]" />
                            <span className="text-[10px] font-mono text-white font-medium">
                              View Wallpaper
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[9/19.5] w-[105px] xs:w-[120px] sm:w-[130px] md:w-[138px] rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border-[2px] border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center text-white/30">
                          <span className="text-[10px] font-mono">Unset</span>
                        </div>
                      )}

                      <span className="text-[11px] sm:text-xs font-mono text-white/50 tracking-wider">
                        Lockscreen
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Setup Switcher Circles (Active / Passive Indicators) */}
              {profile.setups.length > 0 && (
                <div className="pt-3.5 sm:pt-5 mt-3 sm:mt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {profile.setups.map((setup, idx) => {
                      const isActive = idx === activeSetupIndex
                      return (
                        <button
                          key={setup.id}
                          onClick={() => setActiveSetupIndex(idx)}
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
                  </div>

                  <span className="text-xs font-mono text-white/30">
                    {profile.setups.length} {profile.setups.length === 1 ? "Setup" : "Setups"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FULL FAVORITES MODAL (When clicking 'Show All')          */}
      {/* ======================================================== */}
      {showAllFavorites && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAllFavorites(false)}
        >
          <div
            className="w-full max-w-4xl bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="font-aspekta text-xl font-medium text-white tracking-tight">
                  {profile?.displayName}&apos;s Favorite Wallpapers
                </h3>
                <p className="text-white/40 text-xs mt-0.5 font-mono">
                  {resolvedFavourites.length} wallpapers in collection
                </p>
              </div>

              <button
                onClick={() => setShowAllFavorites(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Search */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter curator favorites..."
                  value={favoritesSearch}
                  onChange={(e) => setFavoritesSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            {/* Wallpaper Grid */}
            <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {resolvedFavourites
                  .filter((w) => {
                    if (!favoritesSearch.trim()) return true
                    return w.name.toLowerCase().includes(favoritesSearch.toLowerCase())
                  })
                  .map((wall) => (
                    <div
                      key={wall.sha}
                      onClick={() => setInspectedWallpaper(wall)}
                      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-[var(--accent-light)] cursor-pointer transition-all hover:scale-[1.03]"
                    >
                      <img
                        src={wall.preview_url}
                        alt={wall.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-mono text-white font-medium truncate px-1">
                          View & Download
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* WALLPAPER DETAIL MODAL (For Inspecting Any Wallpaper)    */}
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
