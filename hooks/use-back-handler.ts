'use client'

import { useEffect, useId, useRef } from 'react'
import { globalBackHandlerManager } from '@/lib/back-handler-manager'

interface UseBackHandlerOptions {
  isActive: boolean
  onBack: () => void
  priority?: number // Higher priority handlers are called first
}

export function useBackHandler({ isActive, onBack, priority = 0 }: UseBackHandlerOptions) {
  const handlerId = useId()
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
    globalBackHandlerManager.updateCallback(handlerId, () => onBackRef.current())
  }, [handlerId, onBack])

  useEffect(() => {
    globalBackHandlerManager.registerOrUpdate(handlerId, {
      isActive,
      priority,
      onBack: () => onBackRef.current(),
    })

    return () => {
      globalBackHandlerManager.unregister(handlerId)
    }
  }, [handlerId, isActive, priority])
}
