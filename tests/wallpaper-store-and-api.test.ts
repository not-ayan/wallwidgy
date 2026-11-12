import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getRawWallpaperIndex,
  getParsedWallpapers,
  resetWallpaperStoreCache,
} from '../lib/wallpaper-store'
import { fetchIndexJson, resetServerWallpapersCache } from '../lib/wallpapers'
import { GET as getWallpapersApi } from '../app/api/wallpapers/route'
import { GET as getRandomWallpapersApi } from '../app/api/random-wallpapers/route'
import { GET as getSearchApi } from '../app/api/wallpapers/search/route'
import { GET as getColorsApi } from '../app/api/colors/route'
import { resetColorsCacheForTests } from '../lib/colors'
import { GET as getDownloadsApi } from '../app/api/downloads/route'

const SAMPLE_INDEX = [
  {
    file_name: 'nebula.png',
    file_cache_name: 'nebula.webp',
    file_main_name: 'nebula.png',
    width: 3840,
    height: 2160,
    resolution: '3840x2160',
    orientation: 'Desktop',
    timestamp: '2026-06-01T00:00:00Z',
    category: '#abstract',
    data: {
      primary_colors: ['blue'],
      secondary_colors: ['black'],
      tags: ['space', 'nebula'],
    },
  },
  {
    file_name: 'sakura.png',
    file_cache_name: 'sakura.webp',
    file_main_name: 'sakura.png',
    width: 1080,
    height: 1920,
    resolution: '1080x1920',
    orientation: 'Mobile',
    timestamp: '2026-06-02T00:00:00Z',
    category: '#nature',
    data: {
      primary_colors: ['pink'],
      secondary_colors: ['white'],
      tags: ['flower'],
    },
  },
]

test('Issue 2: client getParsedWallpapers does not poison cache on cold failure and recovers on retry', async () => {
  resetWallpaperStoreCache()
  const originalFetch = globalThis.fetch
  let attempt = 0

  globalThis.fetch = (async () => {
    attempt++
    if (attempt <= 2) {
      return new Response('Upstream down', { status: 502 })
    }
    return new Response(JSON.stringify(SAMPLE_INDEX), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  try {
    // First attempt fails (internal API + GitHub fallback both 502)
    await assert.rejects(() => getParsedWallpapers(), /Failed to load wallpapers index/)

    // Retry must hit network again instead of returning poisoned empty cache
    const result = await getParsedWallpapers()
    assert.equal(result.wallpapers.length, 2)
    assert.equal(result.wallpapers[0].name, 'sakura.png')
    assert.ok(attempt >= 3)

    // Subsequent concurrent call uses populated cache without fetching
    const prevAttempt = attempt
    const [a, b] = await Promise.all([getRawWallpaperIndex(), getParsedWallpapers()])
    assert.equal(a.length, 2)
    assert.equal(b.wallpapers.length, 2)
    assert.equal(attempt, prevAttempt)
  } finally {
    globalThis.fetch = originalFetch
    resetWallpaperStoreCache()
  }
})

test('Issue 2: concurrent cold getParsedWallpapers calls deduplicate to a single fetch sequence', async () => {
  resetWallpaperStoreCache()
  const originalFetch = globalThis.fetch
  let fetchCount = 0

  globalThis.fetch = (async () => {
    fetchCount++
    await new Promise((r) => setTimeout(r, 15))
    return new Response(JSON.stringify(SAMPLE_INDEX), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  try {
    const [r1, r2, r3] = await Promise.all([
      getParsedWallpapers(),
      getParsedWallpapers(),
      getParsedWallpapers(),
    ])
    assert.equal(fetchCount, 1)
    assert.equal(r1.wallpapers.length, 2)
    assert.equal(r2.wallpapers.length, 2)
    assert.equal(r3.wallpapers.length, 2)
  } finally {
    globalThis.fetch = originalFetch
    resetWallpaperStoreCache()
  }
})

test('Issue 2: /api/wallpapers preserves color filter when type matches 0 items and rejects NaN count', async () => {
  resetServerWallpapersCache()
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async () =>
    new Response(JSON.stringify(SAMPLE_INDEX), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch

  try {
    await fetchIndexJson()

    // blue exists only on Desktop; requesting color=blue&type=mobile must return 404, NOT drop color=blue
    const mismatchRes = await getWallpapersApi(
      new Request('https://wallwidgy.test/api/wallpapers?color=blue&type=mobile')
    )
    assert.equal(mismatchRes.status, 404)

    // Invalid NaN count must return 400
    const badCountRes = await getWallpapersApi(
      new Request('https://wallwidgy.test/api/wallpapers?count=abc')
    )
    assert.equal(badCountRes.status, 400)

    const badSearchCountRes = await getSearchApi(
      new Request('https://wallwidgy.test/api/wallpapers/search?q=space&count=abc') as any
    )
    assert.equal(badSearchCountRes.status, 400)

    const badLimitRes = await getDownloadsApi(
      new Request('https://wallwidgy.test/api/downloads?limit=notanumber')
    )
    assert.equal(badLimitRes.status, 400)
  } finally {
    globalThis.fetch = originalFetch
    resetServerWallpapersCache()
  }
})

test('Issue 2: /api/random-wallpapers & /api/wallpapers/search do not edge-cache empty degraded responses', async () => {
  resetServerWallpapersCache()
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response('fail', { status: 503 })) as typeof fetch

  try {
    const randRes = await getRandomWallpapersApi(
      new Request('https://wallwidgy.test/api/random-wallpapers?count=1')
    )
    assert.equal(randRes.status, 502)
    assert.equal(randRes.headers.get('Cache-Control'), 'no-store')

    const searchRes = await getSearchApi(
      new Request('https://wallwidgy.test/api/wallpapers/search?q=space') as any
    )
    assert.equal(searchRes.status, 502)
    assert.equal(searchRes.headers.get('Cache-Control'), 'no-store')
  } finally {
    globalThis.fetch = originalFetch
    resetServerWallpapersCache()
  }
})

test('Issue 2: /api/colors deduplicates concurrent cold fetches', async () => {
  resetColorsCacheForTests()
  const originalFetch = globalThis.fetch
  let fetchCount = 0

  globalThis.fetch = (async () => {
    fetchCount++
    await new Promise((r) => setTimeout(r, 15))
    return new Response(JSON.stringify({ item1: { colors: ['blue', 'red'] } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  try {
    const [r1, r2, r3] = await Promise.all([getColorsApi(), getColorsApi(), getColorsApi()])
    assert.equal(fetchCount, 1)
    assert.equal(r1.status, 200)
    assert.equal(r2.status, 200)
    assert.equal(r3.status, 200)
  } finally {
    globalThis.fetch = originalFetch
    resetColorsCacheForTests()
  }
})
