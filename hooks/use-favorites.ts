"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

interface UseFavoritesReturn {
  favorites: string[]
  isLoading: boolean
  toggleFavorite: (wallpaperId: string) => Promise<void>
  isFavorite: (wallpaperId: string) => boolean
  syncLocalToCloud: () => Promise<void>
  clearAllFavorites: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const { isSignedIn, isLoaded } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites on mount and when auth state changes
  useEffect(() => {
    if (!isLoaded) return

    const loadFavorites = async () => {
      setIsLoading(true)
      
      if (isSignedIn) {
        // User is signed in - fetch from API
        try {
          const response = await fetch('/api/favorites')
          if (response.ok) {
            const data = await response.json()
            setFavorites(data.favorites || [])
            // Also sync to localStorage as backup
            localStorage.setItem('favorites', JSON.stringify(data.favorites || []))
          } else {
            // Fallback to localStorage if API fails
            loadFromLocalStorage()
          }
        } catch (error) {
          console.error('Error fetching favorites from API:', error)
          loadFromLocalStorage()
        }
      } else {
        // User is not signed in - use localStorage
        loadFromLocalStorage()
      }
      
      setIsLoading(false)
    }

    const loadFromLocalStorage = () => {
      const storedFavorites = localStorage.getItem('favorites')
      if (storedFavorites) {
        try {
          setFavorites(JSON.parse(storedFavorites))
        } catch {
          setFavorites([])
        }
      }
    }

    loadFavorites()
  }, [isSignedIn, isLoaded])

  // Sync local favorites to cloud when user signs in
  const syncLocalToCloud = useCallback(async () => {
    if (!isSignedIn) return

    const localFavorites = localStorage.getItem('favorites')
    if (!localFavorites) return

    try {
      const parsed = JSON.parse(localFavorites)
      if (parsed.length === 0) return

      // Merge local favorites with cloud favorites
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        const cloudFavorites = data.favorites || []
        
        // Merge without duplicates
        const merged = [...new Set([...cloudFavorites, ...parsed])]
        
        // Save merged favorites to cloud
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: merged })
        })
        
        setFavorites(merged)
        localStorage.setItem('favorites', JSON.stringify(merged))
      }
    } catch (error) {
      console.error('Error syncing favorites:', error)
    }
  }, [isSignedIn])

  // Auto-sync when user signs in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      syncLocalToCloud()
    }
  }, [isSignedIn, isLoaded, syncLocalToCloud])

  const toggleFavorite = useCallback(async (wallpaperId: string) => {
    const isFav = favorites.includes(wallpaperId)
    const newFavorites = isFav
      ? favorites.filter(id => id !== wallpaperId)
      : [...favorites, wallpaperId]

    // Optimistic update
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))

    if (isSignedIn) {
      // Sync to cloud
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
        console.error('Error syncing favorite to cloud:', error)
        // Revert on error
        setFavorites(favorites)
        localStorage.setItem('favorites', JSON.stringify(favorites))
      }
    }
  }, [favorites, isSignedIn])

  const isFavorite = useCallback((wallpaperId: string) => {
    return favorites.includes(wallpaperId)
  }, [favorites])

  const clearAllFavorites = useCallback(async () => {
    // Optimistic update
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

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    syncLocalToCloud,
    clearAllFavorites
  }
}
