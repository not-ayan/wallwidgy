import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN })

export async function GET() {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME

    if (!owner || !repo) {
      return NextResponse.json({ error: 'GitHub configuration missing' }, { status: 500 })
    }

    //If local file not found, proceed with GitHub API call
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: 'tags.json',
    })

    if (!('content' in response.data)) {
      throw new Error('Invalid response format')
    }

    const tagsData = JSON.parse(Buffer.from(response.data.content, 'base64').toString())

    // Collect all unique colors
    const uniqueColors = new Set<string>()
    Object.values(tagsData).forEach((item: any) => {
      if (item.colors && Array.isArray(item.colors)) {
        item.colors.forEach((color: string) => uniqueColors.add(color))
      }
    })

    const colors = Array.from(uniqueColors).map(color => ({
      name: color,
      hex: getColorHex(color)
    }))

    return NextResponse.json(colors)
  } catch (error: any) {
    console.error('Error in /api/colors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'darkslategray': '#2F4F4F',
    'black': '#000000',
    // Add more color mappings as needed
  }
  return colorMap[colorName.toLowerCase()] || '#000000'
}

