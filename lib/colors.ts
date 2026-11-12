let cachedColors: any[] | null = null
let lastFetchedColorsTime = 0
let colorsFetchPromise: Promise<any[]> | null = null
const COLORS_TTL = 86400 * 1000

export function resetColorsCacheForTests() {
  cachedColors = null
  lastFetchedColorsTime = 0
  colorsFetchPromise = null
}

function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'darkslategray': '#2F4F4F',
    'black': '#000000',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'white': '#FFFFFF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'gray': '#808080',
    'grey': '#808080',
    'silver': '#C0C0C0',
    'maroon': '#800000',
    'olive': '#808000',
    'purple': '#800080',
    'teal': '#008080',
    'navy': '#000080',
    'orange': '#FFA500',
    'brown': '#A52A2A',
    'gold': '#FFD700',
    'pink': '#FFC0CB',
    'violet': '#EE82EE',
    'indigo': '#4B0082',
  }
  return colorMap[colorName.toLowerCase()] || '#000000'
}

export async function fetchColorsWithSingleFlight(): Promise<any[]> {
  const now = Date.now()
  if (cachedColors && cachedColors.length > 0 && (now - lastFetchedColorsTime < COLORS_TTL)) {
    return cachedColors
  }
  if (colorsFetchPromise) {
    return colorsFetchPromise
  }

  colorsFetchPromise = (async () => {
    try {
      const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'not-ayan'
      const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'storage'

      const tagsResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/tags.json`, {
        next: { revalidate: 86400 } // Cache tags.json for 24 hours
      })

      if (!tagsResponse.ok) {
        if (cachedColors && cachedColors.length > 0) {
          return cachedColors
        }
        throw new Error(`Failed to fetch tags.json: ${tagsResponse.status}`)
      }

      const tagsData = await tagsResponse.json()
      const uniqueColors = new Set<string>()
      if (tagsData && typeof tagsData === 'object') {
        Object.values(tagsData).forEach((item: any) => {
          if (item?.colors && Array.isArray(item.colors)) {
            item.colors.forEach((color: string) => {
              if (color && typeof color === 'string') uniqueColors.add(color)
            })
          }
        })
      }

      const colors = Array.from(uniqueColors).map(color => ({
        name: color,
        hex: getColorHex(color)
      }))

      if (colors.length > 0) {
        cachedColors = colors
        lastFetchedColorsTime = Date.now()
        return colors
      }

      return cachedColors || []
    } catch (error) {
      if (cachedColors && cachedColors.length > 0) {
        return cachedColors
      }
      throw error
    } finally {
      colorsFetchPromise = null
    }
  })()

  return colorsFetchPromise
}

