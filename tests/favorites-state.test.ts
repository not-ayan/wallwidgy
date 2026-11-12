import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeWallpaperId,
  isIdMatching,
  deduplicateIds,
  applyFavoriteAction,
  applyFavoriteToggle,
  parseStoredFavoritesJson,
  createKeyedTaskQueue,
} from '../lib/favorites-state'

test('Issue 1: normalizeWallpaperId, isIdMatching, and deduplicateIds handle extensions and encoding', () => {
  assert.equal(normalizeWallpaperId('Abstract%20Wave.PNG'), 'abstract wave')
  assert.equal(isIdMatching('Sunset.png', 'sunset.webp'), true)
  assert.deepEqual(deduplicateIds(['Alpha.png', 'alpha.webp', 'Beta.jpg', '']), [
    'Alpha.png',
    'Beta.jpg',
  ])
})

test('Issue 1: parseStoredFavoritesJson safely handles null, corrupted JSON, and non-arrays', () => {
  assert.deepEqual(parseStoredFavoritesJson(null), [])
  assert.deepEqual(parseStoredFavoritesJson('{broken json'), [])
  assert.deepEqual(parseStoredFavoritesJson('{"a":1}'), [])
  assert.deepEqual(parseStoredFavoritesJson('["wall1.png", "wall1.webp", "", 123, "wall2.jpg"]'), [
    'wall1.png',
    'wall2.jpg',
  ])
})

test('Issue 1: rapid concurrent toggles + single failure rollback preserve sibling toggles', () => {
  let state: string[] = []

  // Toggle A (add)
  const toggleA = applyFavoriteToggle(state, 'wallA.png')
  state = toggleA.nextFavorites
  assert.equal(toggleA.action, 'add')
  assert.deepEqual(state, ['wallA.png'])

  // Toggle B (add) while A is in-flight
  const toggleB = applyFavoriteToggle(state, 'wallB.png')
  state = toggleB.nextFavorites
  assert.equal(toggleB.action, 'add')
  assert.deepEqual(state, ['wallA.png', 'wallB.png'])

  // Request A fails -> roll back ONLY A without clobbering B
  state = applyFavoriteAction(state, 'wallA.png', 'remove')
  assert.deepEqual(state, ['wallB.png'])
})

test('Issue 1: createKeyedTaskQueue serializes per-key RMW without losing concurrent updates or stalling on errors', async () => {
  const queue = createKeyedTaskQueue()
  const serverStore = new Map<string, string[]>([['user-1', []]])

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const patch = (userId: string, wallpaperId: string, shouldFail = false) =>
    queue.enqueue(userId, async () => {
      const snapshot = [...(serverStore.get(userId) ?? [])]
      await delay(10)
      if (shouldFail) {
        throw new Error('Transient Clerk 500')
      }
      const next = applyFavoriteAction(snapshot, wallpaperId, 'add')
      serverStore.set(userId, next)
      return next
    })

  // Concurrent requests for user-1, including one failure in the middle
  const results = await Promise.allSettled([
    patch('user-1', 'wall-1.png'),
    patch('user-1', 'wall-fail.png', true),
    patch('user-1', 'wall-2.png'),
    patch('user-1', 'wall-3.png'),
  ])

  assert.equal(results[0].status, 'fulfilled')
  assert.equal(results[1].status, 'rejected')
  assert.equal(results[2].status, 'fulfilled')
  assert.equal(results[3].status, 'fulfilled')
  assert.deepEqual(serverStore.get('user-1'), ['wall-1.png', 'wall-2.png', 'wall-3.png'])
})
