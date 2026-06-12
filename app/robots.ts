import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/favorites/'],
      },
      {
        userAgent: ['ByteSpider', 'Amazonbot', 'GPTBot', 'ClaudeBot', 'CCBot'],
        disallow: ['/'],
      }
    ],
    sitemap: 'https://wallwidgy.vercel.app/sitemap.xml', // Update to domain or use dynamic origin if needed, but absolute URL is best.
  }
}
