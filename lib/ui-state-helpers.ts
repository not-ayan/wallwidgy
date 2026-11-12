import { isIdMatching, normalizeWallpaperId } from './favorites-state'

export interface FilterableWallpaper {
  sha: string
  name: string
  platform?: string
  category?: string
  colors?: string[]
}

export function filterWallpapersList<T extends FilterableWallpaper>(
  wallpapers: T[],
  options: {
    favoriteIds?: string[]
    platformFilter?: 'all' | 'desktop' | 'mobile'
    selectedCategories?: string[]
    colorFilter?: string
  }
): T[] {
  let list = wallpapers
  const { favoriteIds, platformFilter = 'all', selectedCategories = [], colorFilter } = options

  if (favoriteIds !== undefined) {
    list = list.filter((wallpaper) =>
      favoriteIds.some((favId) => isIdMatching(favId, wallpaper.sha) || isIdMatching(favId, wallpaper.name))
    )
  }

  if (platformFilter !== 'all') {
    list = list.filter((wallpaper) => wallpaper.platform?.toLowerCase() === platformFilter)
  }

  if (selectedCategories.length > 0) {
    list = list.filter((wallpaper) => Boolean(wallpaper.category && selectedCategories.includes(wallpaper.category)))
  }

  if (colorFilter) {
    const targetColor = colorFilter.toLowerCase().trim()
    list = list.filter((wallpaper) => wallpaper.colors?.includes(targetColor))
  }

  return list
}

export function appendPaginationSlice<T extends { sha: string }>(
  prev: T[],
  filtered: T[],
  loadMoreSize: number
): { next: T[]; hasMore: boolean } {
  const startIndex = prev.length
  const endIndex = startIndex + loadMoreSize
  const slice = filtered.slice(startIndex, endIndex)
  const hasMore = endIndex < filtered.length

  if (slice.length === 0) {
    return { next: prev, hasMore }
  }

  const existingShas = new Set(prev.map((w) => w.sha))
  const uniqueNew = slice.filter((w) => !existingShas.has(w.sha))
  return {
    next: uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev,
    hasMore,
  }
}

export function findIndexItemForWallpaper<T extends { file_name?: string; file_main_name?: string }>(
  data: T[],
  wallpaper: { sha?: string; name?: string }
): T | undefined {
  const targetNorm = normalizeWallpaperId(wallpaper.sha || wallpaper.name || '')
  return data.find(
    (item) =>
      (wallpaper.sha && item.file_name === wallpaper.sha) ||
      (wallpaper.name && (item.file_name === wallpaper.name || item.file_main_name === wallpaper.name)) ||
      (item.file_name && targetNorm && normalizeWallpaperId(item.file_name) === targetNorm)
  )
}

export function createLatestRequestGuard() {
  let latestId = 0
  return {
    next(): number {
      latestId += 1
      return latestId
    },
    isCurrent(id: number): boolean {
      return id === latestId
    },
    invalidate(): void {
      latestId += 1
    },
  }
}

export function parseStoredStringArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function selectLatestUnreadToast<T extends { id: string; timestamp: string }>(
  items: T[],
  readIds: string[],
  dismissedIds: string[]
): T | null {
  const unread = items.filter((n) => !readIds.includes(n.id) && !dismissedIds.includes(n.id))
  if (unread.length === 0) return null
  const sorted = [...unread].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  return sorted[0] || null
}

