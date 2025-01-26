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
      max_results: count,
    }

    if (tag) {
      options.tags = tag
    }

    const result = await cloudinary.api.resources(options)

    const wallpapers = result.resources
      .sort(() => 0.5 - Math.random()) // Shuffle the array
      .slice(0, count) // Take only the requested number of wallpapers
      .map((resource: any) => {
        const wallpaper = {
          public_id: resource.public_id,
          name: resource.public_id.split("/").pop(),
          width: resource.width,
          height: resource.height,
          format: resource.format,
          created_at: resource.created_at,
          tags: resource.tags || [],
          colors: resource.colors || [],
        }

        if (resolution) {
          const [width, height] = resolution.split("x").map(Number)
          wallpaper.preview_url = cloudinaryUrl(resource.public_id, { width, height, crop: "fill" })
        } else {
          wallpaper.preview_url = cloudinaryUrl(resource.public_id, { width: 600, height: 400, crop: "fill" })
        }

        wallpaper.download_url = cloudinaryUrl(resource.public_id, { isDownload: true })

        return wallpaper
      })

    return NextResponse.json(wallpapers)
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

