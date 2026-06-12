import { MetadataRoute } from 'next'
import { fetchIndexJson } from '@/lib/wallpapers'

export const revalidate = 86400 // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://wallwidgy.vercel.app'

  // Static routes
  const routes = [
    '',
    '/news',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  try {
    const data = await fetchIndexJson()
    if (!data || !Array.isArray(data)) {
      return routes
    }

    // Dynamic wallpapers
    const wallpaperRoutes = data.map((item: any) => ({
      url: `${baseUrl}/wallpaper/${encodeURIComponent(item.file_name)}`,
      lastModified: new Date(item.timestamp || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...routes, ...wallpaperRoutes]
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return routes
  }
}
