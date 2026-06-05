'use client'

import { useEffect } from 'react'

/** Unregister stale production service workers that break dev chunk loading. */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister().catch(() => {})
      }
    })

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.includes('workbox') || key.includes('next-pwa')) {
            caches.delete(key).catch(() => {})
          }
        }
      })
    }
  }, [])

  return null
}
