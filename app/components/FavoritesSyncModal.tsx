"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Heart, RefreshCw, Check, X, Sparkles, Layers } from "lucide-react"

interface FavoritesSyncModalProps {
  isOpen: boolean
  guestCount: number
  cloudCount: number
  unsyncedCount?: number
  totalMergedCount: number
  onMerge: () => Promise<void>
  onKeepAccount: () => Promise<void>
  onClose: () => void
}

export default function FavoritesSyncModal({
  isOpen,
  guestCount,
  cloudCount,
  unsyncedCount = 0,
  totalMergedCount,
  onMerge,
  onKeepAccount,
  onClose,
}: FavoritesSyncModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isProcessing, setIsProcessing] = useState<"merge" | "account" | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleMerge = async () => {
    setIsProcessing("merge")
    try {
      await onMerge()
    } finally {
      setIsProcessing(null)
    }
  }

  const handleKeepAccount = async () => {
    setIsProcessing("account")
    try {
      await onKeepAccount()
    } finally {
      setIsProcessing(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isProcessing) onClose()
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/90 z-10 animate-in zoom-in-95 duration-200 font-outfit">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing !== null}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
            <Heart className="w-6 h-6 fill-red-500 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/50">Favorites Sync</span>
              <Sparkles className="w-3 h-3 text-[#F7F06D]" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Sync Guest Favorites</h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/70 leading-relaxed mb-6">
          {unsyncedCount > 0 ? (
            <>
              You added <span className="font-semibold text-white">{unsyncedCount} {unsyncedCount === 1 ? 'new wallpaper' : 'new wallpapers'}</span> while browsing as a guest. Your account already has <span className="font-semibold text-white">{cloudCount} {cloudCount === 1 ? 'favorite' : 'favorites'}</span>.
            </>
          ) : (
            <>
              We found <span className="font-semibold text-white">{guestCount} {guestCount === 1 ? 'wallpaper' : 'wallpapers'}</span> saved on this device. Your account already has <span className="font-semibold text-white">{cloudCount} {cloudCount === 1 ? 'favorite' : 'favorites'}</span>.
            </>
          )}
        </p>

        {/* Stat badges */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-xs text-white/50 mb-1">
              {unsyncedCount > 0 ? 'Guest Addition' : 'Guest Session'}
            </span>
            <span className="text-base font-semibold text-white">
              {unsyncedCount > 0 ? `+${unsyncedCount} new` : `${guestCount} saved`}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-xs text-white/50 mb-1">Account</span>
            <span className="text-base font-semibold text-white">{cloudCount} saved</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleMerge}
            disabled={isProcessing !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl bg-white text-black font-medium text-sm hover:bg-white/90 active:scale-[0.99] transition-all shadow-lg shadow-white/5 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing === "merge" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
            <span>Merge All Favorites ({totalMergedCount})</span>
          </button>

          <button
            onClick={handleKeepAccount}
            disabled={isProcessing !== null}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm font-medium transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isProcessing === "account" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Keep Account Favorites Only ({cloudCount})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
