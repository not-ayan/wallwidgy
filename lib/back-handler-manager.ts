export interface BackHandlerEntry {
  id: string
  onBack: () => void
  priority: number
  isActive: boolean
  activatedOrder: number
}

export interface HistoryAdapter {
  getState: () => any
  getHref: () => string
  pushState: (state: any, title: string, url: string) => void
  back: () => void
  addPopStateListener: (listener: (event: PopStateEvent) => void) => void
  removePopStateListener: (listener: (event: PopStateEvent) => void) => void
}

const GUARD_STATE_KEY = '__wallwidgyBackGuard'

function createBrowserHistoryAdapter(): HistoryAdapter | null {
  if (typeof window === 'undefined') return null
  return {
    getState: () => window.history.state,
    getHref: () => window.location.href,
    pushState: (state, title, url) => window.history.pushState(state, title, url),
    back: () => window.history.back(),
    addPopStateListener: (listener) => window.addEventListener('popstate', listener),
    removePopStateListener: (listener) => window.removeEventListener('popstate', listener),
  }
}

export function createBackHandlerManager(adapterFactory: () => HistoryAdapter | null = createBrowserHistoryAdapter) {
  let handlers: BackHandlerEntry[] = []
  let hasGuardEntry = false
  let listenerAttached = false
  let pendingProgrammaticPops = 0
  let orderCounter = 0
  let guardSeq = 0
  let isHandlingPopState = false
  let rearmScheduled = false

  function getAdapter(): HistoryAdapter | null {
    return adapterFactory()
  }

  function getActiveHandlers(): BackHandlerEntry[] {
    return handlers
      .filter((h) => h.isActive)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return b.activatedOrder - a.activatedOrder
      })
  }

  function ensureListener(adapter: HistoryAdapter) {
    if (!listenerAttached) {
      adapter.addPopStateListener(handlePopState)
      listenerAttached = true
    }
  }

  function removeListenerIfIdle(adapter: HistoryAdapter) {
    if (listenerAttached && getActiveHandlers().length === 0 && pendingProgrammaticPops === 0) {
      adapter.removePopStateListener(handlePopState)
      listenerAttached = false
    }
  }

  function armGuard(adapter: HistoryAdapter) {
    if (!hasGuardEntry) {
      const currentState = adapter.getState()
      const nextState =
        currentState && typeof currentState === 'object'
          ? { ...currentState, [GUARD_STATE_KEY]: true, guardSeq: ++guardSeq }
          : { [GUARD_STATE_KEY]: true, guardSeq: ++guardSeq }
      adapter.pushState(nextState, '', adapter.getHref())
      hasGuardEntry = true
    }
    ensureListener(adapter)
  }

  function scheduleRearmCheck() {
    if (rearmScheduled) return
    rearmScheduled = true
    queueMicrotask(() => {
      rearmScheduled = false
      const adapter = getAdapter()
      if (!adapter) return
      const active = getActiveHandlers()
      if (active.length > 0 && !hasGuardEntry) {
        armGuard(adapter)
      } else if (active.length === 0) {
        removeListenerIfIdle(adapter)
      }
    })
  }

  function handlePopState() {
    const adapter = getAdapter()
    if (!adapter) return

    if (pendingProgrammaticPops > 0) {
      pendingProgrammaticPops--
      removeListenerIfIdle(adapter)
      return
    }

    if (isHandlingPopState) return

    // Popstate means the browser already popped the top history entry
    hasGuardEntry = false

    const active = getActiveHandlers()
    if (active.length === 0) {
      removeListenerIfIdle(adapter)
      return
    }

    isHandlingPopState = true
    try {
      const top = active[0]
      top.onBack()

      // If other handlers remain active synchronously, re-arm immediately;
      // otherwise wait a microtask so React commits any close state before deciding.
      const otherActive = getActiveHandlers().filter((h) => h.id !== top.id)
      if (otherActive.length > 0) {
        armGuard(adapter)
      } else {
        scheduleRearmCheck()
      }
    } finally {
      isHandlingPopState = false
    }
  }

  function sync() {
    const adapter = getAdapter()
    if (!adapter) return

    const active = getActiveHandlers()
    if (active.length > 0) {
      armGuard(adapter)
      return
    }

    // No active handlers remain
    if (hasGuardEntry && !isHandlingPopState) {
      hasGuardEntry = false
      const currentState = adapter.getState()
      if (currentState && typeof currentState === 'object' && currentState[GUARD_STATE_KEY] === true) {
        ensureListener(adapter)
        pendingProgrammaticPops++
        adapter.back()
        return
      }
    }

    removeListenerIfIdle(adapter)
  }

  function registerOrUpdate(id: string, options: { isActive: boolean; onBack: () => void; priority: number }) {
    const existingIndex = handlers.findIndex((h) => h.id === id)
    const wasActive = existingIndex >= 0 ? handlers[existingIndex].isActive : false
    const activatedOrder =
      options.isActive && !wasActive
        ? ++orderCounter
        : existingIndex >= 0
          ? handlers[existingIndex].activatedOrder
          : 0

    const entry: BackHandlerEntry = {
      id,
      onBack: options.onBack,
      priority: options.priority,
      isActive: options.isActive,
      activatedOrder,
    }

    if (existingIndex >= 0) {
      handlers[existingIndex] = entry
    } else {
      handlers.push(entry)
    }

    sync()
  }

  function updateCallback(id: string, onBack: () => void) {
    const existing = handlers.find((h) => h.id === id)
    if (existing) {
      existing.onBack = onBack
    }
  }

  function unregister(id: string) {
    handlers = handlers.filter((h) => h.id !== id)
    sync()
  }

  function getDebugState() {
    return {
      activeCount: getActiveHandlers().length,
      totalHandlers: handlers.length,
      hasGuardEntry,
      listenerAttached,
      pendingProgrammaticPops,
    }
  }

  function reset() {
    const adapter = getAdapter()
    if (adapter && listenerAttached) {
      adapter.removePopStateListener(handlePopState)
    }
    handlers = []
    hasGuardEntry = false
    listenerAttached = false
    pendingProgrammaticPops = 0
    orderCounter = 0
    guardSeq = 0
    isHandlingPopState = false
    rearmScheduled = false
  }

  return {
    registerOrUpdate,
    updateCallback,
    unregister,
    handlePopState,
    getDebugState,
    reset,
  }
}

export const globalBackHandlerManager = createBackHandlerManager()

