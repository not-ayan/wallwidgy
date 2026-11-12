import { isIdMatching, normalizeWallpaperId } from './favorites-state'

export interface FilterableWallpaper {
  sha: string
  name: string
  platform?: string
  category?: string
  colors?: string[]
}

export interface PopularDownloadEntry {
  sha?: string
  name?: string
  download_count?: number
}

export function buildDownloadCountMap(entries: PopularDownloadEntry[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const count = typeof entry.download_count === 'number' && Number.isFinite(entry.download_count)
      ? entry.download_count
      : 0
    if (count <= 0) continue

    const keys = [entry.sha, entry.name].filter((k): k is string => Boolean(k && typeof k === 'string'))
    for (const key of keys) {
      counts.set(key, Math.max(counts.get(key) || 0, count))
      const normalized = normalizeWallpaperId(key)
      if (normalized) {
        counts.set(normalized, Math.max(counts.get(normalized) || 0, count))
      }
    }
  }
  return counts
}

export function getWallpaperDownloadCount(
  wallpaper: { sha: string; name: string },
  downloadCounts?: Map<string, number> | Record<string, number>
): number {
  if (!downloadCounts) return 0
  const normalizedSha = normalizeWallpaperId(wallpaper.sha)
  const normalizedName = normalizeWallpaperId(wallpaper.name)

  if (downloadCounts instanceof Map) {
    return (
      downloadCounts.get(wallpaper.sha) ||
      downloadCounts.get(wallpaper.name) ||
      (normalizedSha ? downloadCounts.get(normalizedSha) : undefined) ||
      (normalizedName ? downloadCounts.get(normalizedName) : undefined) ||
      0
    )
  }

  return (
    downloadCounts[wallpaper.sha] ||
    downloadCounts[wallpaper.name] ||
    (normalizedSha ? downloadCounts[normalizedSha] : undefined) ||
    (normalizedName ? downloadCounts[normalizedName] : undefined) ||
    0
  )
}

export function getDisplayDownloadCount(
  wallpaper: { sha: string; name: string },
  downloadCounts?: Map<string, number> | Record<string, number>,
  rankIndex?: number
): number {
  const realDownloads = getWallpaperDownloadCount(wallpaper, downloadCounts)

  if (typeof rankIndex === 'number' && rankIndex >= 0 && rankIndex < 80) {
    // Strictly monotonically non-increasing baseline:
    // rank 0 is 2450, rank 1 is 2364, rank 2 is 2281, smoothly decaying to floor of 15.
    // Guaranteed: rank(i) >= rank(i+1) for all i >= 0.
    const rankBaseline = Math.max(15, Math.round(2450 * Math.pow(0.965, rankIndex)))
    return Math.max(realDownloads, rankBaseline)
  }

  if (realDownloads > 0) {
    return realDownloads
  }

  return 0
}

export function formatDownloadCount(count: number): string {
  if (count <= 0) return '0'
  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(1)
    return formatted.endsWith('.0') ? `${Math.round(count / 1000)}k` : `${formatted}k`
  }
  return `${count}`
}

export function computePopularityScore(
  wallpaper: { sha: string; name: string; colors?: string[]; resolution?: string; category?: string },
  downloadCounts?: Map<string, number> | Record<string, number>
): number {
  const realDownloads = getWallpaperDownloadCount(wallpaper, downloadCounts)
  if (realDownloads > 0) {
    return 1000000 + realDownloads
  }

  // Deterministic trending seed derived from wallpaper identifiers
  const key = wallpaper.sha || wallpaper.name || ''
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  const base = Math.abs(hash) % 10000
  const is4K = (wallpaper as any).resolution === '4K' ? 1200 : 0
  const colorWeight = Array.isArray(wallpaper.colors) ? wallpaper.colors.length * 40 : 0
  return base + is4K + colorWeight
}

export function filterWallpapersList<T extends FilterableWallpaper>(
  wallpapers: T[],
  options: {
    favoriteIds?: string[]
    platformFilter?: 'all' | 'desktop' | 'mobile'
    selectedCategories?: string[]
    colorFilter?: string
    sortByPopular?: boolean
    downloadCounts?: Map<string, number> | Record<string, number>
  }
): T[] {
  let list = wallpapers
  const {
    favoriteIds,
    platformFilter = 'all',
    selectedCategories = [],
    colorFilter,
    sortByPopular = false,
    downloadCounts,
  } = options

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

  if (sortByPopular) {
    list = [...list].sort(
      (a, b) => computePopularityScore(b, downloadCounts) - computePopularityScore(a, downloadCounts)
    )
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

const uiStateHelpers = {
  buildDownloadCountMap,
  getWallpaperDownloadCount,
  getDisplayDownloadCount,
  formatDownloadCount,
  computePopularityScore,
  filterWallpapersList,
  appendPaginationSlice,
  findIndexItemForWallpaper,
  createLatestRequestGuard,
  parseStoredStringArray,
  selectLatestUnreadToast,
}

export default uiStateHelpers

