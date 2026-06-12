import https from 'https'

let cachedData: any[] | null = null
let fetchPromise: Promise<any[]> | null = null
let lastFetchedTime = 0
const CACHE_TTL = 3600 * 1000 // Cache in memory for 1 hour

function fetchJsonViaHttps(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = (targetUrl: string) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to load ${targetUrl}, status code: ${res.statusCode}`))
          return
        }
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      }).on('error', reject)
    }
    request(url)
  })
}

export async function fetchIndexJson(): Promise<any[]> {
  const now = Date.now()
  if (cachedData && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedData
  }
  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    try {
      const data = await fetchJsonViaHttps('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
      if (Array.isArray(data)) {
        cachedData = data
        lastFetchedTime = Date.now()
        return data
      }
      return []
    } catch (error) {
      console.error("Error fetching index.json in fetchIndexJson via https:", error)
      fetchPromise = null // Allow retrying on failure
      return cachedData || [] // Return stale cache if available, otherwise empty array
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}
