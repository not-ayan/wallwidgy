import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN })

export async function GET() {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME

    if (!owner || !repo) {
      throw new Error('GitHub configuration missing')
    }

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: 'tags.json',
    })

    if (!('content' in response.data)) {
      throw new Error('Invalid response format')
    }

    const tagsData = JSON.parse(Buffer.from(response.data.content, 'base64').toString())
    
    // Collect all unique tags and their counts
    const tagCounts = new Map<string, number>()
    Object.values(tagsData).forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      }
    })

    const categories = Array.from(tagCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }))

    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error in /api/categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

