import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const count = Number.parseInt(searchParams.get("count") || "1", 10)
  const tag = searchParams.get("tag")
  const resolution = searchParams.get("resolution")

  try {
    const options: any = {
      type: "upload",
      prefix: "wallpapers",
      max_results: 500, // Fetch more results to ensure randomness
    }

    if (tag) {
      options.tags = tag
    }

    const result = await cloudinary.api.resources(options)

    let wallpapers = result.resources
      .filter((wallpaper: any) => {
        if (tag === "desktop") {
          return wallpaper.width > wallpaper.height
        } else if (tag === "mobile") {
          return wallpaper.height > wallpaper.width
        }
        return true
      })
      .sort(() => Math.random() - 0.5) // Shuffle the array

    if (resolution) {
      wallpapers = wallpapers.filter((wallpaper: any) => {
        const [width, height] = [wallpaper.width, wallpaper.height]
        switch (resolution) {
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
      })
    }

    wallpapers = wallpapers.slice(0, count) // Take only the requested number of wallpapers

    const mappedWallpapers = wallpapers.map((resource: any) => ({
      public_id: resource.public_id,
      name: resource.public_id.split("/").pop(),
      width: resource.width,
      height: resource.height,
      format: resource.format,
      created_at: resource.created_at,
      tags: resource.tags || [],
      colors: resource.colors || [],
      preview_url: cloudinaryUrl(resource.public_id, { width: 600, height: 400, crop: "fill" }),
      download_url: cloudinaryUrl(resource.public_id, { isDownload: true }),
    }))

    return NextResponse.json(mappedWallpapers)
  } catch (error: any) {
    console.error("Error fetching random wallpapers:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
    isDownload?: boolean
  },
) {
  const transformations = options.isDownload ? [] : ["f_auto", "q_auto"]

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transformationString = transformations.join(",")

  if (options.isDownload) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
  } else {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`
  }
}

