"use client"

export interface Wallpaper {
  sha: string
  name: string
  width: number
  height: number
  preview_url: string
  download_url: string
  resolution: string
  tag: "Desktop" | "Mobile"
  platform: "Desktop" | "Mobile"
  uploadDate: Date
  format?: string
  category?: string
  colors?: string[]
}

export interface AvailableColor {
  name: string
  hex: string
}

const COLOR_MAP: Record<string, string> = {
  darkslategray: '#2F4F4F',
  black: '#000000',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  white: '#FFFFFF',
  yellow: '#FFFF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  gray: '#808080',
  grey: '#808080',
  silver: '#C0C0C0',
  maroon: '#800000',
  olive: '#808000',
  purple: '#800080',
  teal: '#008080',
  navy: '#000080',
  orange: '#FFA500',
  brown: '#A52A2A',
  gold: '#FFD700',
  pink: '#FFC0CB',
  violet: '#EE82EE',
  indigo: '#4B0082',
}

// Module-level in-memory singletons to prevent redundant network requests and CPU cycles
let rawDataCache: any[] | null = null
let rawDataPromise: Promise<any[]> | null = null
let parsedWallpapersCache: Wallpaper[] | null = null
let derivedColorsCache: AvailableColor[] | null = null

const SESSION_CACHE_KEY = 'wallwidgy_raw_index_v1'
const SESSION_CACHE_TIMESTAMP_KEY = 'wallwidgy_raw_index_timestamp_v1'
const SESSION_CACHE_TTL = 3600 * 1000 // 1 hour

/**
 * Fetches and caches the raw JSON index from our compressed API route with fallbacks.
 * Deduplicates in-flight requests and caches across the session.
 */
export async function getRawWallpaperIndex(): Promise<any[]> {
  // 1. In-memory cache hit
  if (rawDataCache && rawDataCache.length > 0) {
    return rawDataCache
  }

  // 2. In-flight promise deduplication
  if (rawDataPromise) {
    return rawDataPromise
  }

  // 3. SessionStorage cache hit
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY)
      const timestamp = sessionStorage.getItem(SESSION_CACHE_TIMESTAMP_KEY)
      if (cached && timestamp && Date.now() - parseInt(timestamp, 10) < SESSION_CACHE_TTL) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawDataCache = parsed
          return parsed
        }
      }
    } catch {
      // Ignore sessionStorage read failures (quota or privacy mode)
    }
  }

  // 4. Fetch from network
  rawDataPromise = (async () => {
    try {
      // First attempt: internal compressed route (gzip/brotli, ~560KB)
      let res = await fetch('/api/wallpapers/index')
      
      // Fallback: direct GitHub Raw if local API is unreachable
      if (!res.ok) {
        res = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch wallpaper index: ${res.status}`)
      }

      const data = await res.json()
      if (!Array.isArray(data)) {
        throw new Error('Invalid wallpaper index format: expected an array')
      }

      rawDataCache = data

      // Persist to sessionStorage for instant sub-page and back-button loads
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data))
          sessionStorage.setItem(SESSION_CACHE_TIMESTAMP_KEY, Date.now().toString())
        } catch {
          // Ignore quota exceeded error
        }
      }

      return data
    } catch (err) {
      console.error('Error loading wallpaper index:', err)
      return rawDataCache || []
    } finally {
      rawDataPromise = null
    }
  })()

  return rawDataPromise
}

/**
 * Returns structured wallpapers and colors parsed and transformed once in memory.
 */
export async function getParsedWallpapers(): Promise<{
  wallpapers: Wallpaper[]
  availableColors: AvailableColor[]
}> {
  if (parsedWallpapersCache && derivedColorsCache) {
    return {
      wallpapers: parsedWallpapersCache,
      availableColors: derivedColorsCache,
    }
  }

  const rawData = await getRawWallpaperIndex()
  const uniqueColors = new Set<string>()

  const wallpapers: Wallpaper[] = rawData.map((item: any) => {
    const primaryColors = item.data?.primary_colors
    const secondaryColors = item.data?.secondary_colors
    const colorsList: string[] = []

    const processColorVal = (val: any) => {
      if (Array.isArray(val)) {
        val.forEach((c) => {
          if (c && typeof c === 'string') {
            const cleaned = c.toLowerCase().trim()
            colorsList.push(cleaned)
            uniqueColors.add(cleaned)
          }
        })
      } else if (typeof val === 'string') {
        val.split(/[\s,]+/).forEach((c) => {
          if (c) {
            const cleaned = c.toLowerCase().trim()
            colorsList.push(cleaned)
            uniqueColors.add(cleaned)
          }
        })
      }
    }

    processColorVal(primaryColors)
    processColorVal(secondaryColors)

    return {
      sha: item.file_name,
      name: item.file_name,
      width: item.width,
      height: item.height,
      preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${item.file_cache_name}`,
      download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${item.file_main_name}`,
      resolution: item.resolution,
      tag: item.orientation,
      platform: item.orientation,
      uploadDate: new Date(item.timestamp),
      format: item.file_name.split('.').pop() || 'unknown',
      category: item.category,
      colors: colorsList,
    }
  })

  // Sort newest first
  wallpapers.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())

  const derivedColors: AvailableColor[] = Array.from(uniqueColors).map((color) => ({
    name: color,
    hex: COLOR_MAP[color.toLowerCase()] || '#000000',
  }))

  parsedWallpapersCache = wallpapers
  derivedColorsCache = derivedColors

  return { wallpapers, availableColors: derivedColors }
}
