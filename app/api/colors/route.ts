import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'not-ayan'
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'storage'

    // Fetch tags.json directly from raw.githubusercontent.com
    const tagsResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/tags.json`, {
      next: { revalidate: 86400 } // Cache tags.json for 24 hours
    })

    if (!tagsResponse.ok) {
      throw new Error(`Failed to fetch tags.json: ${tagsResponse.status}`)
    }

    const tagsData = await tagsResponse.json()

    // Collect all unique colors
    const uniqueColors = new Set<string>()
    Object.values(tagsData).forEach((item: any) => {
      if (item.colors && Array.isArray(item.colors)) {
        item.colors.forEach((color: string) => {
          if (color) uniqueColors.add(color)
        })
      }
    })

    const colors = Array.from(uniqueColors).map(color => ({
      name: color,
      hex: getColorHex(color)
    }))

    const response = NextResponse.json(colors)
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=600')
    return response
  } catch (error: any) {
    console.error('Error in /api/colors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
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
