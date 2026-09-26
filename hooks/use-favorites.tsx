"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import FavoritesSyncModal from '@/app/components/FavoritesSyncModal'

export function normalizeWallpaperId(id: string): string {
  if (!id) return ''
  return decodeURIComponent(id).replace(/\.[^/.]+$/, '').toLowerCase().trim()
}

export function isIdMatching(id1: string, id2: string): boolean {
  if (!id1 || !id2) return false
  if (id1 === id2) return true
  return normalizeWallpaperId(id1) === normalizeWallpaperId(id2)
}

export function deduplicateIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (!id || typeof id !== 'string') continue
    const norm = normalizeWallpaperId(id)
    if (!seen.has(norm)) {
      seen.add(norm)
      result.push(id)
    }
  }
  return result
}

interface FavoritesContextType {
  favorites: string[]
  isLoading: boolean
  toggleFavorite: (wallpaperId: string) => Promise<void>
  isFavorite: (wallpaperId: string) => boolean
  syncLocalToCloud: () => Promise<void>
  clearAllFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Sync conflict modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [pendingGuestFavorites, setPendingGuestFavorites] = useState<string[]>([])
  const [pendingCloudFavorites, setPendingCloudFavorites] = useState<string[]>([])
  const [unsyncedCount, setUnsyncedCount] = useState(0)

  // Helper to safely read localStorage
  const getStoredFavorites = useCallback((): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('favorites')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed.filter(Boolean)
      }
    } catch (e) {
      console.error('Failed to parse favorites from localStorage', e)
    }
    return []
  }, [])

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) {
            setFavorites(parsed)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Main auth & favorites synchronization effect
  useEffect(() => {
    if (!isLoaded) return

    let isMounted = true

    const syncFavorites = async () => {
      setIsLoading(true)

      const localFavorites = getStoredFavorites()

      if (!isSignedIn || !userId) {
        // Guest user: load directly from local storage
        if (isMounted) {
          setFavorites(localFavorites)
          setIsLoading(false)
        }
        return
      }

      // Signed in user
      try {
        const res = await fetch('/api/favorites', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to fetch cloud favorites: ${res.status}`)
        }
        const data = await res.json()
        const cloudFavorites: string[] = Array.isArray(data.favorites) ? data.favorites : []

        if (!isMounted) return

        // Check if there are local favorites that do not exist in the cloud account
        const unsyncedGuestItems = localFavorites.filter(
          guestId => !cloudFavorites.some(cloudId => isIdMatching(guestId, cloudId))
        )

        if (unsyncedGuestItems.length === 0) {
          // No new guest favorites to sync -> smoothly align local with cloud
          setFavorites(cloudFavorites)
          localStorage.setItem('favorites', JSON.stringify(cloudFavorites))
          setIsLoading(false)
        } else if (cloudFavorites.length === 0) {
          // Account has 0 favorites -> Automatically migrate guest favorites to account
          const cleanLocal = deduplicateIds(localFavorites)
          setFavorites(cleanLocal)
          localStorage.setItem('favorites', JSON.stringify(cleanLocal))

          await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favorites: cleanLocal })
          })
          setIsLoading(false)
        } else {
          // Account has favorites AND user added extra favorites as guest -> Show choice modal!
          setPendingGuestFavorites(localFavorites)
          setPendingCloudFavorites(cloudFavorites)
          setUnsyncedCount(unsyncedGuestItems.length)
          // Display merged preview in state so user doesn't lose sight of their favorites
          const mergedPreview = deduplicateIds([...localFavorites, ...cloudFavorites])
          setFavorites(mergedPreview)
          setIsSyncModalOpen(true)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error synchronizing favorites on sign-in:', err)
        if (isMounted) {
          setFavorites(localFavorites)
          setIsLoading(false)
        }
      }
    }

    syncFavorites()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, isLoaded, userId, getStoredFavorites])

  // Resolve sync modal choices
  const handleMergeFavorites = useCallback(async () => {
    if (!userId) return
    const merged = deduplicateIds([...pendingCloudFavorites, ...pendingGuestFavorites])
    setFavorites(merged)
    localStorage.setItem('favorites', JSON.stringify(merged))
    setIsSyncModalOpen(false)

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: merged })
      })
    } catch (e) {
      console.error('Error saving merged favorites to cloud:', e)
    }
  }, [pendingCloudFavorites, pendingGuestFavorites, userId])

  const handleKeepAccountFavorites = useCallback(async () => {
    if (!userId) return
    setFavorites(pendingCloudFavorites)
    localStorage.setItem('favorites', JSON.stringify(pendingCloudFavorites))
    setIsSyncModalOpen(false)
  }, [pendingCloudFavorites, userId])

  const handleCloseSyncModal = useCallback(() => {
    // If dismissed with X/backdrop without clicking buttons, default to account favorites to avoid prompt loop
    setFavorites(pendingCloudFavorites)
    localStorage.setItem('favorites', JSON.stringify(pendingCloudFavorites))
    setIsSyncModalOpen(false)
  }, [pendingCloudFavorites])

  const isFavorite = useCallback((wallpaperId: string): boolean => {
    if (!wallpaperId) return false
    return favorites.some(id => isIdMatching(id, wallpaperId))
  }, [favorites])

  const toggleFavorite = useCallback(async (wallpaperId: string) => {
    if (!wallpaperId) return
    const isFav = isFavorite(wallpaperId)

    const newFavorites = isFav
      ? favorites.filter(id => !isIdMatching(id, wallpaperId))
      : deduplicateIds([...favorites, wallpaperId])

    // Optimistic update
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))

    if (isSignedIn) {
      try {
        await fetch('/api/favorites', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallpaperId,
            action: isFav ? 'remove' : 'add'
          })
        })
      } catch (error) {
        console.error('Error syncing favorite change to cloud:', error)
        // Revert on error
        setFavorites(favorites)
        localStorage.setItem('favorites', JSON.stringify(favorites))
      }
    }
  }, [favorites, isFavorite, isSignedIn])

  const clearAllFavorites = useCallback(async () => {
    setFavorites([])
    localStorage.setItem('favorites', '[]')

    if (isSignedIn) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: [] })
        })
      } catch (error) {
        console.error('Error clearing favorites from cloud:', error)
      }
    }
  }, [isSignedIn])

  const syncLocalToCloud = useCallback(async () => {
    if (!isSignedIn) return
    const local = getStoredFavorites()
    try {
      const res = await fetch('/api/favorites', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const cloud = Array.isArray(data.favorites) ? data.favorites : []
        const merged = deduplicateIds([...cloud, ...local])
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: merged })
        })
        setFavorites(merged)
        localStorage.setItem('favorites', JSON.stringify(merged))
      }
    } catch (e) {
      console.error('Manual sync failed:', e)
    }
  }, [isSignedIn, getStoredFavorites])

  const totalMergedCount = useMemo(() => {
    return deduplicateIds([...pendingCloudFavorites, ...pendingGuestFavorites]).length
  }, [pendingCloudFavorites, pendingGuestFavorites])

  const contextValue = useMemo(() => ({
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    syncLocalToCloud,
    clearAllFavorites
  }), [favorites, isLoading, toggleFavorite, isFavorite, syncLocalToCloud, clearAllFavorites])

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
      <FavoritesSyncModal
        isOpen={isSyncModalOpen}
        guestCount={pendingGuestFavorites.length}
        cloudCount={pendingCloudFavorites.length}
        unsyncedCount={unsyncedCount}
        totalMergedCount={totalMergedCount}
        onMerge={handleMergeFavorites}
        onKeepAccount={handleKeepAccountFavorites}
        onClose={handleCloseSyncModal}
      />
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
