"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Info, Sparkles, AlertTriangle, Megaphone, CheckCheck, ExternalLink } from "lucide-react"
import Link from "next/link"
import { createPortal } from "react-dom"

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "announcement"
  timestamp: string
  link?: string
  linkLabel?: string
}

const STORAGE_KEY = "wallwidgy-read-notifications"
const DISMISSED_TOASTS_KEY = "wallwidgy-dismissed-toasts"

function getRelativeTime(timestamp: string): string {
  try {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    if (isNaN(diffMs) || diffMs < 0) return "Just now"

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`

    return past.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return "Recently"
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track client-side mount state
  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Fetch notifications and load read state
  useEffect(() => {
    // Load read state from localStorage
    const savedReadIds = localStorage.getItem(STORAGE_KEY)
    const parsedReadIds = savedReadIds ? JSON.parse(savedReadIds) : []
    setReadIds(parsedReadIds)

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        // Fetch from dynamic URL or fallback GitHub Gist
        const rawUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "https://gist.githubusercontent.com/not-ayan/3691b5169488c4e713f71aa26b2394f7/raw/notifications.json"
        const finalUrl = rawUrl.includes("?") 
          ? `${rawUrl}&t=${Date.now()}` 
          : `${rawUrl}?t=${Date.now()}`

        const res = await fetch(finalUrl, {
          cache: "no-store", // Get fresh notifications
        })

        if (!res.ok) {
          throw new Error("Failed to fetch")
        }

        const data = await res.json()
        if (Array.isArray(data)) {
          setNotifications(data)
          triggerToastCheck(data, parsedReadIds)
        }
      } catch (err) {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  // 2. Check and trigger on-screen toast for new unread notifications
  const triggerToastCheck = (items: NotificationItem[], currentReadIds: string[]) => {
    const unread = items.filter((n) => !currentReadIds.includes(n.id))
    if (unread.length > 0) {
      // Find the most recent unread notification
      const sortedUnread = [...unread].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      const latestUnread = sortedUnread[0]

      // Check if we already dismissed this specific toast in localStorage
      const savedDismissedToasts = localStorage.getItem(DISMISSED_TOASTS_KEY)
      const dismissedToasts = savedDismissedToasts ? JSON.parse(savedDismissedToasts) : []

      if (!dismissedToasts.includes(latestUnread.id)) {
        // Delay toast slightly for smoother page load feel
        const timer = setTimeout(() => {
          setActiveToast(latestUnread)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }

  // 3. Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Count of unread notifications
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return
    const updated = [...readIds, id]
    setReadIds(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds))
  }

  // Dismiss on-screen toast
  const dismissToast = (id: string) => {
    setActiveToast(null)
    const savedDismissedToasts = localStorage.getItem(DISMISSED_TOASTS_KEY)
    const dismissedToasts = savedDismissedToasts ? JSON.parse(savedDismissedToasts) : []
    if (!dismissedToasts.includes(id)) {
      const updated = [...dismissedToasts, id]
      localStorage.setItem(DISMISSED_TOASTS_KEY, JSON.stringify(updated))
    }
    // Also mark it as read when dismissed
    markAsRead(id)
  }

  // Get corresponding icon for notification type
  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <Sparkles className="w-4 h-4 text-[#F7F06D]" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "announcement":
        return <Megaphone className="w-4 h-4 text-blue-400" />
      default:
        return <Info className="w-4 h-4 text-white/60" />
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (unreadCount > 0) {
            // When opening, mark what they saw as read after a short delay
            setTimeout(() => {
              markAllAsRead()
            }, 1000)
          }
        }}
        className={`p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5 relative ${
          isOpen ? "text-white bg-white/5" : ""
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 transition-transform hover:rotate-12 ${unreadCount > 0 ? "animate-pulse text-white" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F7F06D] rounded-full ring-2 ring-[#0A0A0A] animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F7F06D] rounded-full ring-2 ring-[#0A0A0A]" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-[-80px] sm:right-0 top-full mt-2.5 w-[320px] sm:w-[380px] bg-[#0F0F0F]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/90 z-[999] overflow-hidden origin-top-right transition-all duration-200">
          {/* Popover Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-outfit text-sm font-semibold tracking-wide text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#F7F06D]/15 text-[#F7F06D] text-[10px] font-mono rounded-full font-bold">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-white/40 hover:text-white flex items-center gap-1 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Popover Content */}
          <div className="max-h-[360px] overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs text-white/40">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/40 font-outfit">All caught up! No notifications.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 flex gap-3 transition-colors hover:bg-white/[0.02] cursor-pointer relative ${
                      !isRead ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    {/* Unread Status Dot Indicator */}
                    {!isRead && (
                      <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#F7F06D] rounded-full" />
                    )}

                    {/* Icon Container */}
                    <div className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.05] shrink-0">
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-outfit text-xs font-semibold text-white mb-0.5 tracking-wide flex items-center gap-1.5">
                        {item.title}
                      </h4>
                      <p className="font-outfit text-[11px] leading-relaxed text-white/50 mb-2">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white/30 uppercase">
                          {getRelativeTime(item.timestamp)}
                        </span>
                        {item.link && (
                          <Link
                            href={item.link}
                            target={item.link.startsWith("http") ? "_blank" : "_self"}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#F7F06D] hover:text-white transition-colors"
                          >
                            {item.linkLabel || "View"}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Admin Helper Footer */}
          <div className="px-5 py-3.5 bg-white/[0.01] border-t border-white/[0.06] text-center">
            <p className="text-[9px] font-mono text-white/20 select-none">
              PUSH LIVE NOTICES VIA STORAGE REPO ON GITHUB
            </p>
          </div>
        </div>
      )}

      {/* On-Screen Toast Notification */}
      {activeToast && mounted && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] w-[340px] sm:w-[380px] bg-[#0E0E0E]/95 backdrop-blur-xl border border-[#F7F06D]/20 rounded-2xl shadow-2xl shadow-black/80 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Border highlight glow effect similar to premium sign-in button */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5" />
          
          <div className="flex gap-3 relative z-10">
            {/* Type Icon */}
            <div className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-[#F7F06D]/10 border border-[#F7F06D]/20 shrink-0">
              {getTypeIcon(activeToast.type)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h4 className="font-outfit text-xs font-semibold text-white tracking-wide">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => dismissToast(activeToast.id)}
                  className="text-white/40 hover:text-white p-1 hover:bg-white/5 rounded transition-colors"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-outfit text-[11px] leading-relaxed text-white/60 mb-3">
                {activeToast.message}
              </p>
              
              <div className="flex items-center gap-2">
                {activeToast.link ? (
                  <Link
                    href={activeToast.link}
                    onClick={() => dismissToast(activeToast.id)}
                    target={activeToast.link.startsWith("http") ? "_blank" : "_self"}
                    className="px-3.5 py-1.5 bg-[#F7F06D] hover:bg-white text-black font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    {activeToast.linkLabel || "Learn More"}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                ) : null}
                <button
                  onClick={() => dismissToast(activeToast.id)}
                  className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white/80 hover:text-white font-medium text-[10px] rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
