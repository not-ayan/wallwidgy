'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseBackHandlerOptions {
  isActive: boolean
  onBack: () => void
  priority?: number // Higher priority handlers are called first
}

// Global state to manage multiple back handlers
let backHandlers: Array<{
  id: string
  onBack: () => void
  priority: number
  isActive: boolean
}> = []

let isHandlingPopState = false

export function useBackHandler({ isActive, onBack, priority = 0 }: UseBackHandlerOptions) {
  const handlerIdRef = useRef<string>()
  
  // Generate unique ID for this handler
  if (!handlerIdRef.current) {
    handlerIdRef.current = Math.random().toString(36).substr(2, 9)
  }

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (isHandlingPopState) return

    // Find the highest priority active handler
    const activeHandlers = backHandlers
      .filter(handler => handler.isActive)
      .sort((a, b) => b.priority - a.priority)

    if (activeHandlers.length > 0) {
      isHandlingPopState = true
      event.preventDefault()
      event.stopPropagation()
      
      // Call the highest priority handler
      activeHandlers[0].onBack()
      
      // Push a new state to prevent actual navigation
      window.history.pushState(null, '', window.location.href)
      
      setTimeout(() => {
        isHandlingPopState = false
      }, 100)
    }
  }, [])

  useEffect(() => {
    const handlerId = handlerIdRef.current!

    // Register this handler
    const handlerIndex = backHandlers.findIndex(h => h.id === handlerId)
    const handler = {
      id: handlerId,
      onBack,
      priority,
      isActive
    }

    if (handlerIndex >= 0) {
      backHandlers[handlerIndex] = handler
    } else {
      backHandlers.push(handler)
    }

    // Add popstate listener only if we have active handlers
    const hasActiveHandlers = backHandlers.some(h => h.isActive)
    if (hasActiveHandlers && !isHandlingPopState) {
      // Push a state entry so we can intercept back navigation
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      // Clean up this handler
      backHandlers = backHandlers.filter(h => h.id !== handlerId)
      
      // Remove listener if no active handlers remain
      const remainingActiveHandlers = backHandlers.some(h => h.isActive)
      if (!remainingActiveHandlers) {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [isActive, onBack, priority, handlePopState])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handlePopState])
}