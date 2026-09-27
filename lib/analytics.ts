export interface DownloadPayload {
  sha: string
  name: string
  platform?: string
  category?: string
}

/**
 * Tracks a wallpaper download to Cloudflare D1 (and Umami Analytics if present).
 * Uses keepalive: true so the network request finishes even if the user closes/navigates.
 */
export function trackDownload(wallpaper: {
  sha?: string
  name?: string
  platform?: string
  category?: string
}) {
  if (typeof window === 'undefined') return

  const payload: DownloadPayload = {
    sha: wallpaper.sha || wallpaper.name || 'unknown',
    name: wallpaper.name || 'unknown',
    platform: wallpaper.platform || 'unknown',
    category: wallpaper.category || 'unknown',
  }

  // 1. Send to internal D1 API route
  try {
    fetch('/api/downloads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.warn('Failed to record download in D1:', err)
    })
  } catch (err) {
    console.warn('Error recording download:', err)
  }

  // 2. Also record in Umami Analytics if available
  try {
    if ((window as any).umami && typeof (window as any).umami.track === 'function') {
      ;(window as any).umami.track('wallpaper_download', payload)
    }
  } catch {
    // Umami tracking failed or blocked by adblocker
  }
}
