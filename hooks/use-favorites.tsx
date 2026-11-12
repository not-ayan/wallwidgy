"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import FavoritesSyncModal from '@/app/components/FavoritesSyncModal'
import {
  normalizeWallpaperId,
  isIdMatching,
  deduplicateIds,
  applyFavoriteAction,
  applyFavoriteToggle,
  parseStoredFavoritesJson,
  createKeyedTaskQueue,
} from '@/lib/favorites-state'

export { normalizeWallpaperId, isIdMatching, deduplicateIds }

interface FavoritesContextType {
  favorites: string[]
  isLoading: boolean
  toggleFavorite: (wallpaperId: string) => Promise<void>
  isFavorite: (wallpaperId: string) => boolean
  syncLocalToCloud: () => Promise<void>
  clearAllFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

function persistLocalFavorites(items: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('favorites', JSON.stringify(items))
  } catch (e) {
    console.error('Failed to persist favorites to localStorage', e)
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Sync conflict modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [pendingGuestFavorites, setPendingGuestFavorites] = useState<string[]>([])
  const [pendingCloudFavorites, setPendingCloudFavorites] = useState<string[]>([])
  const [unsyncedCount, setUnsyncedCount] = useState(0)

  const favoritesRef = useRef<string[]>([])
  const syncGenerationRef = useRef(0)
  const mutationQueueRef = useRef(createKeyedTaskQueue())

  const commitFavorites = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setFavorites((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const clean = deduplicateIds(next)
      favoritesRef.current = clean
      persistLocalFavorites(clean)
      return clean
    })
  }, [])

  // Helper to safely read localStorage
  const getStoredFavorites = useCallback((): string[] => {
    if (typeof window === 'undefined') return []
    try {
      return parseStoredFavoritesJson(localStorage.getItem('favorites'))
    } catch (e) {
      console.error('Failed to parse favorites from localStorage', e)
      return []
    }
  }, [])

  // Listen to cross-tab storage changes (including clear/removeItem where newValue === null)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites') {
        const parsed = parseStoredFavoritesJson(e.newValue)
        favoritesRef.current = parsed
        setFavorites(parsed)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Main auth & favorites synchronization effect
  useEffect(() => {
    if (!isLoaded) return

    const generation = ++syncGenerationRef.current
    const controller = new AbortController()

    const resetConflictModal = () => {
      setIsSyncModalOpen(false)
      setPendingGuestFavorites([])
      setPendingCloudFavorites([])
      setUnsyncedCount(0)
    }

    const syncFavorites = async () => {
      setIsLoading(true)
      const localFavorites = getStoredFavorites()

      if (!isSignedIn || !userId) {
        // Guest user: load directly from local storage and clear any lingering conflict modal
        resetConflictModal()
        if (syncGenerationRef.current === generation) {
          favoritesRef.current = localFavorites
          setFavorites(localFavorites)
          setIsLoading(false)
        }
        return
      }

      // Reset prior user's conflict modal immediately while syncing new session
      resetConflictModal()

      // Signed in user
      try {
        const res = await fetch('/api/favorites', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`Failed to fetch cloud favorites: ${res.status}`)
        }
        const data = await res.json()
        const cloudFavorites: string[] = deduplicateIds(
          Array.isArray(data.favorites) ? data.favorites : []
        )

        if (syncGenerationRef.current !== generation) return

        // Check if there are local favorites that do not exist in the cloud account
        const unsyncedGuestItems = localFavorites.filter(
          guestId => !cloudFavorites.some(cloudId => isIdMatching(guestId, cloudId))
        )

        if (unsyncedGuestItems.length === 0) {
          // No new guest favorites to sync -> smoothly align local with cloud
          commitFavorites(cloudFavorites)
          setIsLoading(false)
        } else if (cloudFavorites.length === 0) {
          // Account has 0 favorites -> Automatically migrate guest favorites to account
          const cleanLocal = deduplicateIds(localFavorites)
          commitFavorites(cleanLocal)

          const postRes = await mutationQueueRef.current.enqueue(userId, () =>
            fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ favorites: cleanLocal }),
              signal: controller.signal,
            })
          )
          if (!postRes.ok) {
            throw new Error(`Failed to migrate guest favorites: ${postRes.status}`)
          }
          if (syncGenerationRef.current === generation) {
            setIsLoading(false)
          }
        } else {
          // Account has favorites AND user added extra favorites as guest -> Show choice modal!
          setPendingGuestFavorites(localFavorites)
          setPendingCloudFavorites(cloudFavorites)
          setUnsyncedCount(unsyncedGuestItems.length)
          const mergedPreview = deduplicateIds([...localFavorites, ...cloudFavorites])
          favoritesRef.current = mergedPreview
          setFavorites(mergedPreview)
          setIsSyncModalOpen(true)
          setIsLoading(false)
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('Error synchronizing favorites on sign-in:', err)
        if (syncGenerationRef.current === generation) {
          favoritesRef.current = localFavorites
          setFavorites(localFavorites)
          setIsLoading(false)
        }
      }
    }

    syncFavorites()

    return () => {
      controller.abort()
    }
  }, [isSignedIn, isLoaded, userId, getStoredFavorites, commitFavorites])

  // Resolve sync modal choices
  const handleMergeFavorites = useCallback(async () => {
    if (!userId) return
    const generation = syncGenerationRef.current
    const merged = deduplicateIds([
      ...pendingCloudFavorites,
      ...pendingGuestFavorites,
      ...favoritesRef.current,
    ])
    const rollbackSnapshot = pendingCloudFavorites

    commitFavorites(merged)
    setIsSyncModalOpen(false)

    try {
      const res = await mutationQueueRef.current.enqueue(userId, () =>
        fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: merged }),
        })
      )
      if (!res.ok) {
        throw new Error(`Failed to save merged favorites: ${res.status}`)
      }
      const data = await res.json().catch(() => null)
      if (syncGenerationRef.current === generation && Array.isArray(data?.favorites)) {
        commitFavorites(data.favorites)
      }
    } catch (e) {
      console.error('Error saving merged favorites to cloud:', e)
      if (syncGenerationRef.current === generation) {
        commitFavorites(rollbackSnapshot)
      }
    }
  }, [pendingCloudFavorites, pendingGuestFavorites, userId, commitFavorites])

  const handleKeepAccountFavorites = useCallback(async () => {
    if (!userId) return
    commitFavorites(pendingCloudFavorites)
    setIsSyncModalOpen(false)
  }, [pendingCloudFavorites, userId, commitFavorites])

  const handleCloseSyncModal = useCallback(() => {
    // If dismissed with X/backdrop without clicking buttons, default to account favorites to avoid prompt loop
    commitFavorites(pendingCloudFavorites)
    setIsSyncModalOpen(false)
  }, [pendingCloudFavorites, commitFavorites])

  const isFavorite = useCallback((wallpaperId: string): boolean => {
    if (!wallpaperId) return false
    return favorites.some(id => isIdMatching(id, wallpaperId))
  }, [favorites])

  const toggleFavorite = useCallback(async (wallpaperId: string) => {
    if (!wallpaperId) return
    const generation = syncGenerationRef.current
    let chosenAction: 'add' | 'remove' = 'add'

    // Functional optimistic update prevents stale-closure clobbering across rapid toggles
    commitFavorites((prev) => {
      const { nextFavorites, action } = applyFavoriteToggle(prev, wallpaperId)
      chosenAction = action
      return nextFavorites
    })

    if (isSignedIn && userId) {
      try {
        const res = await mutationQueueRef.current.enqueue(userId, () =>
          fetch('/api/favorites', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallpaperId,
              action: chosenAction,
            }),
          })
        )
        if (!res.ok) {
          throw new Error(`PATCH /api/favorites failed with ${res.status}`)
        }
      } catch (error) {
        console.error('Error syncing favorite change to cloud:', error)
        // Roll back only this item's mutation without erasing concurrent toggles
        if (syncGenerationRef.current === generation) {
          const rollbackAction: 'add' | 'remove' = chosenAction === 'add' ? 'remove' : 'add'
          commitFavorites((prev) => applyFavoriteAction(prev, wallpaperId, rollbackAction))
        }
      }
    }
  }, [isSignedIn, userId, commitFavorites])

  const clearAllFavorites = useCallback(async () => {
    const generation = syncGenerationRef.current
    const previous = favoritesRef.current
    commitFavorites([])

    if (isSignedIn && userId) {
      try {
        const res = await mutationQueueRef.current.enqueue(userId, () =>
          fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favorites: [] }),
          })
        )
        if (!res.ok) {
          throw new Error(`POST /api/favorites failed with ${res.status}`)
        }
      } catch (error) {
        console.error('Error clearing favorites from cloud:', error)
        if (syncGenerationRef.current === generation) {
          commitFavorites((prev) => deduplicateIds([...previous, ...prev]))
        }
      }
    }
  }, [isSignedIn, userId, commitFavorites])

  const syncLocalToCloud = useCallback(async () => {
    if (!isSignedIn || !userId) return
    const generation = syncGenerationRef.current
    const local = getStoredFavorites()
    try {
      const merged = await mutationQueueRef.current.enqueue(userId, async () => {
        const res = await fetch('/api/favorites', { cache: 'no-store' })
        if (!res.ok) throw new Error(`GET /api/favorites failed with ${res.status}`)
        const data = await res.json()
        const cloud = Array.isArray(data.favorites) ? data.favorites : []
        const combined = deduplicateIds([...cloud, ...local])
        const postRes = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: combined }),
        })
        if (!postRes.ok) throw new Error(`POST /api/favorites failed with ${postRes.status}`)
        return combined
      })
      if (syncGenerationRef.current === generation) {
        commitFavorites(merged)
      }
    } catch (e) {
      console.error('Manual sync failed:', e)
    }
  }, [isSignedIn, userId, getStoredFavorites, commitFavorites])

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
