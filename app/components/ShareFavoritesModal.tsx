"use client"

import { useState, useEffect } from "react"
import { X, Copy, Link as LinkIcon, Check, LogIn } from "lucide-react"
import { useBackHandler } from "@/hooks/use-back-handler"
import { SignInButton } from "@clerk/nextjs"
import { getRawWallpaperIndex } from "@/lib/wallpaper-store"
import { showSakugaToast } from "@/lib/toast"

interface ShareFavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  favoriteIds: string[]
  username?: string | null
  isSignedIn?: boolean
}

export default function ShareFavoritesModal({
  isOpen,
  onClose,
  favoriteIds,
  username,
  isSignedIn,
}: ShareFavoritesModalProps) {
  const [wallpaperLinks, setWallpaperLinks] = useState<{ name: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedProfile, setCopiedProfile] = useState(false)

  // Handle browser back button when modal is open
  useBackHandler({
    isActive: isOpen,
    onBack: onClose,
    priority: 1,
  })

  useEffect(() => {
    if (isOpen && favoriteIds.length > 0) {
      setIsLoading(true)
      fetchWallpaperData()
    }
  }, [isOpen, favoriteIds])

  const fetchWallpaperData = async () => {
    try {
      const data = await getRawWallpaperIndex()
      const origin = typeof window !== "undefined" ? window.location.origin : "https://wallwidgy.app"

      const links = data
        .filter((item: any) => favoriteIds.includes(item.file_name))
        .map((item: any) => ({
          name: item.file_name,
          url: `${origin}/wallpaper/${encodeURIComponent(item.file_name)}`,
        }))

      setWallpaperLinks(links)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching wallpaper data:", error)
      setIsLoading(false)
    }
  }

  const copyAllLinks = async () => {
    try {
      const linksText = wallpaperLinks.map((link) => `${link.name}: ${link.url}`).join("\n")

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linksText)
        showSakugaToast("All links copied to clipboard")
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = linksText
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)

        if (successful) {
          showSakugaToast("All links copied to clipboard")
        } else {
          throw new Error("Fallback copy method failed")
        }
      }
    } catch {
      showSakugaToast("Failed to copy links to clipboard")
    }
  }

  const handleCopyProfileLink = async () => {
    if (!username) return
    const origin = typeof window !== "undefined" ? window.location.origin : "https://wallwidgy.app"
    const shareUrl = `${origin}/share/${username}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedProfile(true)
      showSakugaToast("Profile link copied")
      setTimeout(() => setCopiedProfile(false), 2000)
    } catch {
      showSakugaToast("Failed to copy link")
    }
  }

  if (!isOpen) return null

  const origin = typeof window !== "undefined" ? window.location.origin : "https://wallwidgy.app"
  const profileUrl = username ? `${origin}/share/${username}` : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border border-white/[0.08] rounded-2xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl text-[#EDEDED]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-[#EDEDED] tracking-tight">Share Gallery</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Share Profile Section */}
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <h3 className="text-xs font-medium text-[#EDEDED] mb-1.5">Share Your Public Gallery</h3>
            {isSignedIn ? (
              username ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-xs font-mono text-[#8E8E8E] truncate flex-1">
                    {profileUrl}
                  </p>
                  <button
                    onClick={handleCopyProfileLink}
                    className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedProfile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#8E8E8E]">
                  Set a username in your profile to generate a shareable gallery link.
                </p>
              )
            ) : (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-[#8E8E8E]">
                  Sign in to create a shareable profile and sync your setups.
                </p>
                <SignInButton mode="modal">
                  <button className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-medium transition-colors flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              </div>
            )}
          </div>

          {/* Wallpaper Links Section */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#555555] block mb-2">
              Individual Wallpapers ({wallpaperLinks.length})
            </span>

            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-white/40">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-mono">Loading wallpaper links...</span>
              </div>
            ) : (
              <div className="border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                {wallpaperLinks.map((link, index) => (
                  <div key={index} className="p-3 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <p className="text-xs font-medium text-[#EDEDED] truncate">
                      {link.name.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "")}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#8E8E8E] hover:text-white truncate block mt-0.5 transition-colors"
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-3.5 flex justify-end gap-3">
          <button
            onClick={copyAllLinks}
            disabled={isLoading || wallpaperLinks.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All Links</span>
          </button>
        </div>
      </div>
    </div>
  )
}