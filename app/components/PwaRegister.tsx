'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (
        process.env.NODE_ENV !== 'production' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        // In local development, unregister any active service worker to avoid stale Turbopack chunk caches
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
        return
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('WallWidgy PWA ServiceWorker registered with scope:', registration.scope)
          })
          .catch((error) => {
            console.warn('WallWidgy PWA ServiceWorker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}
