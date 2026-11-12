export function normalizeWallpaperId(id: string): string {
  if (!id || typeof id !== 'string') return ''
  try {
    return decodeURIComponent(id).replace(/\.[^/.]+$/, '').toLowerCase().trim()
  } catch {
    return id.replace(/\.[^/.]+$/, '').toLowerCase().trim()
  }
}

export function isIdMatching(id1: string, id2: string): boolean {
  if (!id1 || !id2) return false
  if (id1 === id2) return true
  return normalizeWallpaperId(id1) === normalizeWallpaperId(id2)
}

export function deduplicateIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (!id || typeof id !== 'string') continue
    const norm = normalizeWallpaperId(id)
    if (!norm) continue
    if (!seen.has(norm)) {
      seen.add(norm)
      result.push(id)
    }
  }
  return result
}

export function applyFavoriteAction(
  favorites: string[],
  wallpaperId: string,
  action: 'add' | 'remove'
): string[] {
  if (!wallpaperId || typeof wallpaperId !== 'string') return deduplicateIds(favorites)
  const clean = deduplicateIds(favorites)
  if (action === 'add') {
    const exists = clean.some((id) => isIdMatching(id, wallpaperId))
    return exists ? clean : [...clean, wallpaperId]
  }
  return clean.filter((id) => !isIdMatching(id, wallpaperId))
}

export function applyFavoriteToggle(
  favorites: string[],
  wallpaperId: string
): { nextFavorites: string[]; action: 'add' | 'remove' } {
  const isFav = favorites.some((id) => isIdMatching(id, wallpaperId))
  const action: 'add' | 'remove' = isFav ? 'remove' : 'add'
  return {
    nextFavorites: applyFavoriteAction(favorites, wallpaperId, action),
    action,
  }
}

export function parseStoredFavoritesJson(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return deduplicateIds(parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))
  } catch {
    return []
  }
}

/**
 * Serializes async read-modify-write tasks per key so concurrent mutations
 * cannot interleave and overwrite each other.
 */
export function createKeyedTaskQueue() {
  const tails = new Map<string, Promise<unknown>>()

  function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = tails.get(key) ?? Promise.resolve()
    const next = prev.then(task, task)
    const cleanup = next.then(
      () => {
        if (tails.get(key) === cleanup) {
          tails.delete(key)
        }
      },
      () => {
        if (tails.get(key) === cleanup) {
          tails.delete(key)
        }
      }
    )
    tails.set(key, cleanup)
    return next
  }

  return { enqueue }
}

