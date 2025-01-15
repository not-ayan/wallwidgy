'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import WallpaperModal from '../../components/WallpaperModal'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN })

export default function WallpaperPage() {
  const { name } = useParams()
  const [wallpaper, setWallpaper] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWallpaper() {
      try {
        const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
        const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME

        if (!owner || !repo) {
          throw new Error('GitHub repository configuration is missing')
        }

        const [fileResponse, analysisResponse] = await Promise.all([
          octokit.repos.getContent({
            owner,
            repo,
            path: decodeURIComponent(name as string),
          }),
          octokit.repos.getContent({
            owner,
            repo,
            path: 'image_analysis.json',
          }),
        ])

        if ('content' in analysisResponse.data) {
          const imageAnalysis = JSON.parse(Buffer.from(analysisResponse.data.content, 'base64').toString())
          const analysis = imageAnalysis.find((item: any) => item.name === name)

          if ('download_url' in fileResponse.data) {
            setWallpaper({
              name: name,
              download_url: fileResponse.data.download_url,
              resolution: analysis?.resolution,
              tag: analysis?.tag,
              blurHash: analysis?.blurHash,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching wallpaper:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (name) {
      fetchWallpaper()
    }
  }, [name])

  if (isLoading) {
    return null
  }

  if (!wallpaper) {
    return <div>Wallpaper not found</div>
  }

  return (
    <WallpaperModal
      isOpen={true}
      onClose={() => window.location.href = '/'}
      wallpaper={wallpaper}
    />
  )
}

