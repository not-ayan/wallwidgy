let cachedData: any[] | null = null
let fetchPromise: Promise<any[]> | null = null
let lastFetchedTime = 0
const CACHE_TTL = 3600 * 1000 // Cache in memory for 1 hour

export async function fetchIndexJson(): Promise<any[]> {
  const now = Date.now()
  if (cachedData && cachedData.length > 0 && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedData
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
        cachedData = data
        lastFetchedTime = Date.now()
        return data
      }
      return cachedData || []
    } catch (error) {
      console.error("Error fetching index.json in fetchIndexJson:", error)
      return cachedData || [] // Return stale cache if available, otherwise empty array
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}
