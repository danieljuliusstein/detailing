'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { destroyProductTour, shouldAutoStartTour, startProductTour } from '@/lib/product-tour'

export default function ProductTour() {
  const pathname = usePathname()
  const startedRef = useRef(false)

  useEffect(() => {
    if (pathname !== '/') {
      startedRef.current = false
      return
    }

    if (!shouldAutoStartTour() || startedRef.current) return

    startedRef.current = true
    const timer = window.setTimeout(() => {
      void startProductTour().then((started) => {
        if (!started) startedRef.current = false
      })
    }, 500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname])

  useEffect(() => {
    return () => {
      destroyProductTour()
    }
  }, [])

  return null
}
