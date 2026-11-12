import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterWallpapersList,
  appendPaginationSlice,
  findIndexItemForWallpaper,
  createLatestRequestGuard,
  parseStoredStringArray,
  selectLatestUnreadToast,
} from '../lib/ui-state-helpers'

const CATALOG = [
  { sha: 'a.png', name: 'a.png', platform: 'Desktop', category: '#anime', colors: ['blue'] },
  { sha: 'b.png', name: 'b.png', platform: 'Mobile', category: '#anime', colors: ['red'] },
  { sha: 'c.png', name: 'c.png', platform: 'Desktop', category: '#minimal', colors: ['blue'] },
  { sha: 'd.png', name: 'd.png', platform: 'Mobile', category: '#minimal', colors: ['black'] },
]

test('Issue 5: filterWallpapersList applies favorites, platform, categories, and color consistently', () => {
  // Favorites + category + platform
  const filtered = filterWallpapersList(CATALOG, {
    favoriteIds: ['a', 'b.webp', 'c.png'],
    platformFilter: 'desktop',
    selectedCategories: ['#anime'],
  })
  assert.deepEqual(
    filtered.map((w) => w.sha),
    ['a.png']
  )

  // Color filter preserved alongside platform filter
  const colorFiltered = filterWallpapersList(CATALOG, {
    platformFilter: 'desktop',
    colorFilter: 'BLUE',
  })
  assert.deepEqual(
    colorFiltered.map((w) => w.sha),
    ['a.png', 'c.png']
  )
})

test('Issue 5: appendPaginationSlice prevents duplicate items on concurrent observer ticks', () => {
  const page1 = CATALOG.slice(0, 2)
  const firstAppend = appendPaginationSlice(page1, CATALOG, 2)
  assert.equal(firstAppend.next.length, 4)
  assert.equal(firstAppend.hasMore, false)

  // Duplicate trigger with same prev length does not duplicate shas
  const alreadyFull = appendPaginationSlice(firstAppend.next, CATALOG, 2)
  assert.equal(alreadyFull.next.length, 4)
  assert.equal(alreadyFull.hasMore, false)
})

test('Issue 4: findIndexItemForWallpaper matches by sha, file_name, file_main_name, or normalized stem', () => {
  const index = [
    { file_name: 'nebula.png', file_main_name: 'desktop/nebula.png', data: { art_style: 'minimal' } },
  ]
  assert.ok(findIndexItemForWallpaper(index, { sha: 'nebula.png', name: 'desktop/nebula.png' }))
  assert.ok(findIndexItemForWallpaper(index, { sha: 'nebula.webp', name: 'nebula.webp' }))
  assert.equal(findIndexItemForWallpaper(index, { sha: 'missing.png', name: 'missing.png' }), undefined)
})

test('Issue 4 & 6: createLatestRequestGuard invalidates stale async completions and cleared queries', () => {
  const guard = createLatestRequestGuard()
  const req1 = guard.next()
  const req2 = guard.next()

  assert.equal(guard.isCurrent(req1), false)
  assert.equal(guard.isCurrent(req2), true)

  // Clearing search input invalidates in-flight req2
  guard.invalidate()
  assert.equal(guard.isCurrent(req2), false)
})

test('Issue 6: NotificationCenter helpers handle corrupted storage and select latest unread/undismissed toast', () => {
  assert.deepEqual(parseStoredStringArray(null), [])
  assert.deepEqual(parseStoredStringArray('{corrupted'), [])
  assert.deepEqual(parseStoredStringArray('["n1", 42, "n2"]'), ['n1', 'n2'])

  const items = [
    { id: 'n1', timestamp: '2026-06-01T10:00:00Z' },
    { id: 'n2', timestamp: '2026-06-03T10:00:00Z' },
    { id: 'n3', timestamp: '2026-06-02T10:00:00Z' },
  ]
  // n2 is read, n1/n3 unread -> picks n3 (newest unread)
  assert.equal(selectLatestUnreadToast(items, ['n2'], [])?.id, 'n3')
  // n3 dismissed -> picks n1
  assert.equal(selectLatestUnreadToast(items, ['n2'], ['n3'])?.id, 'n1')
  // All read -> null
  assert.equal(selectLatestUnreadToast(items, ['n1', 'n2', 'n3'], []), null)
})
