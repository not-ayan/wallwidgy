import { NextResponse } from "next/server"

const STORAGE_INDEX_URL =
  process.env.WALLWIDGY_INDEX_URL || "https://raw.githubusercontent.com/not-ayan/storage/main/index.json"
const STORAGE_CACHE_BASE_URL =
  process.env.WALLWIDGY_CACHE_BASE_URL || "https://raw.githubusercontent.com/not-ayan/storage/main/cache"
const STORAGE_MAIN_BASE_URL =
  process.env.WALLWIDGY_MAIN_BASE_URL || "https://raw.githubusercontent.com/not-ayan/storage/main/main"
const WALLPAPER_LOCAL_BASE_URL = process.env.WALLWIDGY_PUBLIC_BASE_URL || ""
const MAX_COUNT = 100

interface IndexWallpaper {
  file_name: string
  file_main_name?: string
  file_cache_name?: string
  width?: number
  height?: number
  timestamp?: string
  orientation?: "Desktop" | "Mobile" | string
  data?: {
    primary_colors?: string
    secondary_colors?: string
  }
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function matchesResolution(wallpaper: IndexWallpaper, resolution: string): boolean {
  const width = wallpaper.width || 0
  const height = wallpaper.height || 0

  switch (resolution.toLowerCase()) {
    case "1080p":
      return width >= 1920 && height >= 1080
    case "1440p":
      return width >= 2560 && height >= 1440
    case "4k":
      return width >= 3840 && height >= 2160
    case "8k":
      return width >= 7680 && height >= 4320
    default:
      return true
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const count = Number.parseInt(searchParams.get("count") || "1", 10)
  const tag = searchParams.get("tag")?.toLowerCase()
  const resolution = searchParams.get("resolution")

  try {
    if (Number.isNaN(count) || count < 1 || count > MAX_COUNT) {
      return NextResponse.json({ error: `Count must be between 1 and ${MAX_COUNT}` }, { status: 400 })
    }

    const indexResponse = await fetch(STORAGE_INDEX_URL)
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch wallpapers index: ${indexResponse.status} ${indexResponse.statusText}`)
    }

    const rawData = await indexResponse.json()
    if (!Array.isArray(rawData)) {
      throw new Error("Invalid wallpapers index format")
    }

    const indexData: IndexWallpaper[] = rawData
    let wallpapers = [...indexData]

    if (tag === "desktop") {
      wallpapers = wallpapers.filter((wallpaper) => wallpaper.orientation === "Desktop")
    } else if (tag === "mobile") {
      wallpapers = wallpapers.filter((wallpaper) => wallpaper.orientation === "Mobile")
    }

    if (resolution) {
      wallpapers = wallpapers.filter((wallpaper) => matchesResolution(wallpaper, resolution))
    }

    wallpapers = shuffle(wallpapers).slice(0, count)

    const mappedWallpapers = wallpapers.map((wallpaper) => {
      const mainName = wallpaper.file_main_name || wallpaper.file_name
      const cacheName = wallpaper.file_cache_name || wallpaper.file_name
      const colorsRaw = `${wallpaper.data?.primary_colors || ""} ${wallpaper.data?.secondary_colors || ""}`
      const colors = colorsRaw
        .split(/\s+/)
        .filter(Boolean)
      const lastDotIndex = wallpaper.file_name.lastIndexOf(".")
      const extension =
        lastDotIndex > -1 ? wallpaper.file_name.substring(lastDotIndex + 1) || "unknown" : "unknown"
      const localBase = WALLPAPER_LOCAL_BASE_URL || origin
      const encodedFileName = encodeURIComponent(wallpaper.file_name)

      return {
        public_id: wallpaper.file_name,
        name: wallpaper.file_name,
        width: wallpaper.width || 0,
        height: wallpaper.height || 0,
        format: extension,
        created_at: wallpaper.timestamp || null,
        tags: wallpaper.orientation ? [wallpaper.orientation] : [],
        colors,
        preview_url: `${STORAGE_CACHE_BASE_URL}/${cacheName}`,
        download_url: `${STORAGE_MAIN_BASE_URL}/${mainName}`,
        local_url: new URL(`/wallpaper/${encodedFileName}`, localBase).toString(),
      }
    })

    return NextResponse.json(mappedWallpapers)
  } catch (error: any) {
    console.error("Error fetching random wallpapers:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
