'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import TourWelcomeModal from '@/components/TourWelcomeModal'
import { useAuth } from '@/providers/AuthProvider'
import {
  TOUR_REPLAY_EVENT,
  destroyProductTour,
  dismissTourWelcome,
  shouldAutoStartTour,
  shouldShowTourWelcome,
  skipProductTour,
  startProductTour,
} from '@/lib/product-tour'

export default function ProductTour() {
  const pathname = usePathname()
  const { needsOnboarding } = useAuth()
  const startingRef = useRef(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  const runTour = useCallback(() => {
    if (startingRef.current) return
    startingRef.current = true
    setWelcomeOpen(false)
    dismissTourWelcome()
    void startProductTour().finally(() => {
      startingRef.current = false
    })
  }, [])

  const handleSkip = useCallback(() => {
    setWelcomeOpen(false)
    skipProductTour()
  }, [])

  useEffect(() => {
    const tryStart = () => {
      if (pathname !== '/' || needsOnboarding || startingRef.current || !shouldAutoStartTour()) return

      if (shouldShowTourWelcome()) {
        setWelcomeOpen(true)
        return
      }

      runTour()
    }

    if (pathname !== '/' || needsOnboarding) {
      startingRef.current = false
      setWelcomeOpen(false)
      destroyProductTour()
      return
    }

    const timer = window.setTimeout(tryStart, 600)
    window.addEventListener(TOUR_REPLAY_EVENT, tryStart)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(TOUR_REPLAY_EVENT, tryStart)
    }
  }, [pathname, needsOnboarding, runTour])

  useEffect(() => {
    return () => {
      destroyProductTour()
    }
  }, [])

  if (!welcomeOpen) return null

  return <TourWelcomeModal onStart={runTour} onSkip={handleSkip} />
}
