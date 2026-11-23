"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Info, Sparkles, AlertTriangle, Megaphone, CheckCheck, ExternalLink } from "lucide-react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { useBackHandler } from "@/hooks/use-back-handler"
import { parseStoredStringArray, selectLatestUnreadToast } from "@/lib/ui-state-helpers"

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

function readStoredIds(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    return parseStoredStringArray(localStorage.getItem(key))
  } catch {
    return []
  }
}

function writeStoredIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

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
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track client-side mount state & cleanup timers on unmount
  useEffect(() => {
    setMounted(true)
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (autoReadTimerRef.current) clearTimeout(autoReadTimerRef.current)
    }
  }, [])

  // Handle Android back button when notifications panel is open
  useBackHandler({
    isActive: isOpen,
    onBack: () => setIsOpen(false),
    priority: 1,
  })

  // 1. Fetch notifications and load read state
  useEffect(() => {
    let isMounted = true
    const parsedReadIds = readStoredIds(STORAGE_KEY)
    setReadIds(parsedReadIds)

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const rawUrl =
          process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ||
          "https://gist.githubusercontent.com/not-ayan/3691b5169488c4e713f71aa26b2394f7/raw/notifications.json"
        const finalUrl = rawUrl.includes("?")
          ? `${rawUrl}&t=${Date.now()}`
          : `${rawUrl}?t=${Date.now()}`

        const res = await fetch(finalUrl, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch")

        const data = await res.json()
        if (isMounted && Array.isArray(data)) {
          setNotifications(data)
          triggerToastCheck(data, parsedReadIds)
        }
      } catch {
        if (isMounted) setNotifications([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchNotifications()
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Check and trigger on-screen toast for new unread notifications
  const triggerToastCheck = (items: NotificationItem[], currentReadIds: string[]) => {
    const dismissedToasts = readStoredIds(DISMISSED_TOASTS_KEY)
    const latestUnread = selectLatestUnreadToast(items, currentReadIds, dismissedToasts)

    if (latestUnread) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        toastTimerRef.current = null
        const latestRead = readStoredIds(STORAGE_KEY)
        if (!latestRead.includes(latestUnread.id)) {
          setActiveToast(latestUnread)
        }
      }, 1500)
    }
  }

  // 3. Close popover on click outside
  useEffect(() => {
    if (!isOpen && autoReadTimerRef.current) {
      clearTimeout(autoReadTimerRef.current)
      autoReadTimerRef.current = null
    }
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
    setReadIds((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      writeStoredIds(STORAGE_KEY, updated)
      return updated
    })
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setNotifications((currentNotifications) => {
      const allIds = currentNotifications.map((n) => n.id)
      setReadIds(allIds)
      writeStoredIds(STORAGE_KEY, allIds)
      return currentNotifications
    })
  }

  // Dismiss on-screen toast
  const dismissToast = (id: string) => {
    setActiveToast(null)
    const dismissedToasts = readStoredIds(DISMISSED_TOASTS_KEY)
    if (!dismissedToasts.includes(id)) {
      writeStoredIds(DISMISSED_TOASTS_KEY, [...dismissedToasts, id])
    }
    markAsRead(id)
  }

  // Get corresponding icon for notification type
  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      case "announcement":
        return <Megaphone className="w-3.5 h-3.5 text-sky-400" />
      default:
        return <Info className="w-3.5 h-3.5 text-white/60" />
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          const nextOpen = !isOpen
          setIsOpen(nextOpen)
          if (autoReadTimerRef.current) {
            clearTimeout(autoReadTimerRef.current)
            autoReadTimerRef.current = null
          }
          if (nextOpen && unreadCount > 0) {
            autoReadTimerRef.current = setTimeout(() => {
              autoReadTimerRef.current = null
              markAllAsRead()
            }, 1000)
          }
        }}
        className={`p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors relative ${
          isOpen ? "text-white bg-white/[0.06]" : ""
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full ring-2 ring-[#0A0A0A]" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed sm:absolute top-[58px] sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-0 sm:mt-2 w-auto sm:w-[360px] max-w-[380px] sm:max-w-none mx-auto sm:mx-0 bg-[#121212] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 z-[999] overflow-hidden origin-top sm:origin-top-right transition-all">
          {/* Popover Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#EDEDED]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white/10 text-white/70 text-[10px] font-mono rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Popover Content */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-white/[0.04]">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/40">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-mono">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                <Bell className="w-6 h-6 mx-auto mb-1.5 text-white/20" />
                <p className="text-xs font-mono">No notifications</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className="p-3.5 flex gap-3 transition-colors hover:bg-white/[0.02] cursor-pointer relative"
                  >
                    {/* Unread indicator */}
                    {!isRead && (
                      <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-white rounded-full" />
                    )}

                    {/* Icon */}
                    <div className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.05] shrink-0">
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-xs font-medium text-[#EDEDED] mb-0.5 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] leading-relaxed text-[#8E8E8E] mb-2 line-clamp-2">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#555555]">
                          {getRelativeTime(item.timestamp)}
                        </span>
                        {item.link && (
                          <Link
                            href={item.link}
                            target={item.link.startsWith("http") ? "_blank" : "_self"}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-white hover:underline transition-colors"
                          >
                            <span>{item.linkLabel || "View"}</span>
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
        </div>
      )}

      {/* On-Screen Toast Notification */}
      {activeToast && mounted && createPortal(
        <div className="fixed bottom-6 right-3 sm:right-6 left-3 sm:left-auto max-w-[360px] mx-auto sm:mx-0 z-[9999] w-auto sm:w-[360px] bg-[#141414] border border-white/[0.1] rounded-2xl p-4 shadow-2xl shadow-black/90 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex gap-3">
            {/* Type Icon */}
            <div className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0">
              {getTypeIcon(activeToast.type)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h4 className="text-xs font-medium text-[#EDEDED] tracking-tight">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => dismissToast(activeToast.id)}
                  className="text-white/40 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-[#8E8E8E] mb-3">
                {activeToast.message}
              </p>

              <div className="flex items-center gap-2">
                {activeToast.link && (
                  <Link
                    href={activeToast.link}
                    onClick={() => dismissToast(activeToast.id)}
                    target={activeToast.link.startsWith("http") ? "_blank" : "_self"}
                    className="px-3 py-1.5 bg-white hover:bg-white/90 text-black font-medium text-[11px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{activeToast.linkLabel || "Learn more"}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
                <button
                  onClick={() => dismissToast(activeToast.id)}
                  className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white/70 hover:text-white font-medium text-[11px] rounded-lg transition-colors"
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