import test from 'node:test'
import assert from 'node:assert/strict'
import { createBackHandlerManager, type HistoryAdapter } from '../lib/back-handler-manager'

function createMockHistoryAdapter() {
  const stack: Array<{ state: any; url: string }> = [{ state: null, url: 'https://wallwidgy.test/' }]
  const listeners = new Set<(event: PopStateEvent) => void>()
  let pushCount = 0
  let backCount = 0

  const adapter: HistoryAdapter = {
    getState: () => stack[stack.length - 1]?.state ?? null,
    getHref: () => stack[stack.length - 1]?.url ?? 'https://wallwidgy.test/',
    pushState: (state, _title, url) => {
      pushCount++
      stack.push({ state, url })
    },
    back: () => {
      backCount++
      if (stack.length > 1) {
        stack.pop()
      }
      // Browser dispatches popstate asynchronously after history.back()
      queueMicrotask(() => {
        for (const listener of [...listeners]) {
          listener({} as PopStateEvent)
        }
      })
    },
    addPopStateListener: (listener) => listeners.add(listener),
    removePopStateListener: (listener) => listeners.delete(listener),
  }

  function simulateUserBack() {
    if (stack.length > 1) {
      stack.pop()
    }
    for (const listener of [...listeners]) {
      listener({} as PopStateEvent)
    }
  }

  function simulateNextLinkNavigation(url: string) {
    stack.push({ state: { __NA: true }, url })
  }

  return {
    adapter,
    stack,
    listeners,
    getCounts: () => ({ pushCount, backCount, listenerCount: listeners.size, stackLength: stack.length }),
    simulateUserBack,
    simulateNextLinkNavigation,
  }
}

test('Issue 3: re-rendering active handlers does not push duplicate history entries or register multiple listeners', () => {
  const mock = createMockHistoryAdapter()
  const manager = createBackHandlerManager(() => mock.adapter)

  let backCalls = 0
  manager.registerOrUpdate('modal', { isActive: true, priority: 2, onBack: () => { backCalls++ } })
  assert.equal(mock.getCounts().pushCount, 1)
  assert.equal(mock.getCounts().listenerCount, 1)

  // Simulate 20 parent re-renders passing fresh inline callbacks
  for (let i = 0; i < 20; i++) {
    manager.updateCallback('modal', () => { backCalls++ })
    manager.registerOrUpdate('modal', { isActive: true, priority: 2, onBack: () => { backCalls++ } })
  }

  assert.equal(mock.getCounts().pushCount, 1)
  assert.equal(mock.getCounts().listenerCount, 1)
  assert.equal(mock.getCounts().stackLength, 2)

  // Pressing back once fires onBack once
  mock.simulateUserBack()
  assert.equal(backCalls, 1)
})

test('Issue 3: stacked handlers respect priority and re-arm only while outer handler stays active', async () => {
  const mock = createMockHistoryAdapter()
  const manager = createBackHandlerManager(() => mock.adapter)

  const order: string[] = []
  let similarOpen = true
  let modalOpen = true

  manager.registerOrUpdate('modal', {
    isActive: modalOpen,
    priority: 2,
    onBack: () => {
      order.push('modal')
      modalOpen = false
      manager.registerOrUpdate('modal', { isActive: false, priority: 2, onBack: () => {} })
    },
  })
  manager.registerOrUpdate('similar', {
    isActive: similarOpen,
    priority: 3,
    onBack: () => {
      order.push('similar')
      similarOpen = false
      manager.registerOrUpdate('similar', { isActive: false, priority: 3, onBack: () => {} })
    },
  })

  assert.equal(mock.getCounts().pushCount, 1)

  // First back closes SimilarWallpapers (priority 3), keeps modal armed
  mock.simulateUserBack()
  assert.deepEqual(order, ['similar'])
  assert.equal(manager.getDebugState().hasGuardEntry, true)

  // Second back closes Modal (priority 2) cleanly without extra history.back()
  mock.simulateUserBack()
  assert.deepEqual(order, ['similar', 'modal'])
  assert.equal(manager.getDebugState().hasGuardEntry, false)
  await Promise.resolve()
  assert.equal(mock.getCounts().listenerCount, 0)
  assert.equal(mock.getCounts().stackLength, 1)
})

test('Issue 3: UI close pops guard entry; Next.js link navigation is never undone by closing SearchBar', async () => {
  const mock = createMockHistoryAdapter()
  const manager = createBackHandlerManager(() => mock.adapter)

  // Case A: UI close pops the guard entry
  manager.registerOrUpdate('modal', { isActive: true, priority: 1, onBack: () => {} })
  assert.equal(mock.getCounts().stackLength, 2)
  manager.unregister('modal')
  await Promise.resolve()
  assert.equal(mock.getCounts().backCount, 1)
  assert.equal(mock.getCounts().stackLength, 1)
  assert.equal(mock.getCounts().listenerCount, 0)

  // Case B: Link navigation pushes a route state before SearchBar closes -> do NOT call history.back()
  manager.registerOrUpdate('search', { isActive: true, priority: 1, onBack: () => {} })
  mock.simulateNextLinkNavigation('https://wallwidgy.test/wallpaper/nebula')
  const beforeBackCount = mock.getCounts().backCount
  manager.unregister('search')
  await Promise.resolve()
  assert.equal(mock.getCounts().backCount, beforeBackCount)
  assert.equal(mock.adapter.getHref(), 'https://wallwidgy.test/wallpaper/nebula')
})
