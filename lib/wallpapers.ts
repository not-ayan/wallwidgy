let cachedRawData: any[] | null = null
let cachedCleanData: any[] | null = null
let cachedCleanJsonString: string | null = null
let cachedWallpaperMap: Map<string, any> | null = null
let fetchPromise: Promise<any[]> | null = null
let lastFetchedTime = 0
const CACHE_TTL = 3600 * 1000 // Cache in memory for 1 hour

function processData(rawData: any[]) {
  cachedRawData = rawData
  
  // Build clean data & map once
  const cleanData = rawData.map((item: any) => ({
    file_name: item.file_name,
    file_cache_name: item.file_cache_name,
    file_main_name: item.file_main_name,
    width: item.width,
    height: item.height,
    resolution: item.resolution,
    orientation: item.orientation,
    timestamp: item.timestamp,
    category: item.category,
    data: item.data ? {
      art_style: item.data.art_style,
      series: item.data.series,
      character_names: item.data.character_names,
      primary_colors: item.data.primary_colors,
      secondary_colors: item.data.secondary_colors,
      color_palette: item.data.color_palette,
      mood: item.data.mood,
      technique: item.data.technique,
      tags: item.data.tags,
      category: item.data.category,
      objects: item.data.objects,
      textures: item.data.textures,
      scene_description: item.data.scene_description,
    } : undefined
  }))

  cachedCleanData = cleanData
  cachedCleanJsonString = JSON.stringify(cleanData)

  const map = new Map<string, any>()
  for (const item of rawData) {
    if (item.file_name) {
      map.set(item.file_name.toLowerCase(), item)
      const nameWithoutExt = item.file_name.replace(/\.[^/.]+$/, "").toLowerCase()
      if (!map.has(nameWithoutExt)) {
        map.set(nameWithoutExt, item)
      }
    }
  }
  cachedWallpaperMap = map
  lastFetchedTime = Date.now()
}

export async function fetchIndexJson(): Promise<any[]> {
  const now = Date.now()
  if (cachedRawData && cachedRawData.length > 0 && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedRawData
  }
  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WallWidgy/1.0',
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to load index.json from GitHub, status: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        processData(data)
        return data
      }
      return cachedRawData || []
    } catch (error) {
      console.error("Error fetching index.json in fetchIndexJson:", error)
      return cachedRawData || [] // Return stale cache if available, otherwise empty array
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

export async function fetchCleanIndexString(): Promise<string> {
  const now = Date.now()
  if (cachedCleanJsonString && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedCleanJsonString
  }
  await fetchIndexJson()
  return cachedCleanJsonString || '[]'
}

export async function fetchCleanIndexJson(): Promise<any[]> {
  const now = Date.now()
  if (cachedCleanData && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedCleanData
  }
  await fetchIndexJson()
  return cachedCleanData || []
}

export async function findWallpaperByName(name: string): Promise<any | null> {
  await fetchIndexJson()
  if (!cachedWallpaperMap) return null
  const decoded = decodeURIComponent(name).toLowerCase()
  return cachedWallpaperMap.get(decoded) || null
}

