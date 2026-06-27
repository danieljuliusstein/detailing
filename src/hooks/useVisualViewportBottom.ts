'use client'

import { useEffect, useRef } from 'react'

/**
 * Keeps a fixed bottom bar aligned with the visible viewport on iOS Safari / PWA
 * when the URL bar or keyboard changes the visual viewport height.
 */
export function useVisualViewportBottom<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    const vv = window.visualViewport
    if (!el || !vv) return

    const sync = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.transform = gap > 0 ? `translateX(-50%) translateY(-${gap}px)` : 'translateX(-50%)'
    }

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      el.style.removeProperty('transform')
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])

  return ref
}
