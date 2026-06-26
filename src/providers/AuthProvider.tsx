'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resetBackend, syncOnReconnect } from '@/lib/api'
import { clearLocalDeviceDataSync } from '@/lib/clear-local-data'
import {
  hasPinSet,
  isUnlocked,
  lock,
  setPin,
  touchActivity,
  unlock,
  verifyPin,
} from '@/lib/auth'
import {
  authenticatePocketBase,
  clearPocketBaseAuth,
  isPocketBaseAuthenticated,
} from '@/lib/pb-auth'

interface AuthContextValue {
  isAuthenticated: boolean
  needsSetup: boolean
  setupPin: (pin: string) => Promise<void>
  login: (pin: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/auth' ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/book/')
  )
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTick, setAuthTick] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const bumpAuth = useCallback(() => setAuthTick((t) => t + 1), [])

  const ready = mounted
  void authTick

  const hasAccount = mounted && isPocketBaseAuthenticated()
  const needsSetup = mounted && hasAccount && !hasPinSet()
  const authenticated = mounted && hasAccount && hasPinSet() && isUnlocked()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (!mounted || !authenticated || isOnboardingPath(pathname)) return
    void (async () => {
      try {
        const { loadSettingsFromPocketBase } = await import('@/lib/api/settings-pocketbase')
        const settings = await loadSettingsFromPocketBase()
        if (settings && !settings.business_phone?.trim()) {
          setNeedsOnboarding(true)
          router.replace('/onboarding')
        } else {
          setNeedsOnboarding(false)
        }
      } catch {
        setNeedsOnboarding(false)
      }
    })()
  }, [mounted, authenticated, pathname, router])

  useEffect(() => {
    if (!ready) return

    const onActivity = () => {
      if (authenticated) touchActivity()
    }

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const interval = setInterval(() => {
      if (!hasPinSet() || !hasAccount) return
      if (!isUnlocked()) {
        bumpAuth()
        router.replace('/auth')
      }
    }, 30_000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(interval)
    }
  }, [ready, authenticated, hasAccount, router, bumpAuth])

  const isPublicRoute = isPublicPath(pathname)
  const isOnboardingRoute = isOnboardingPath(pathname)

  useEffect(() => {
    if (!ready || isPublicRoute) return

    if (isOnboardingRoute) {
      if (!hasAccount || needsSetup || !isUnlocked()) {
        router.replace('/auth')
      }
      return
    }

    if (!hasAccount || needsSetup || !isUnlocked()) {
      router.replace('/auth')
    }
  }, [ready, hasAccount, needsSetup, pathname, router, isPublicRoute, isOnboardingRoute, authTick])

  const syncPocketBaseInBackground = useCallback(() => {
    void (async () => {
      try {
        await authenticatePocketBase()
        await syncOnReconnect()
      } catch {
        // fall back to local data
      } finally {
        resetBackend()
      }
    })()
  }, [])

  useEffect(() => {
    if (!ready || !authenticated) return
    syncPocketBaseInBackground()
  }, [ready, authenticated, syncPocketBaseInBackground])

  useEffect(() => {
    if (!ready || !authenticated || pathname !== '/auth') return
    if (needsOnboarding) {
      router.replace('/onboarding')
      return
    }
    router.replace('/')
  }, [ready, authenticated, needsOnboarding, pathname, router])

  const setupPinFn = useCallback(async (pin: string) => {
    await setPin(pin)
    unlock()
    bumpAuth()
    router.replace('/')
    syncPocketBaseInBackground()
  }, [router, bumpAuth, syncPocketBaseInBackground])

  const login = useCallback(async (pin: string) => {
    const ok = await verifyPin(pin)
    if (ok) {
      unlock()
      bumpAuth()
      router.replace('/')
      syncPocketBaseInBackground()
    }
    return ok
  }, [router, bumpAuth, syncPocketBaseInBackground])

  const logout = useCallback(() => {
    lock()
    clearPocketBaseAuth()
    void clearLocalDeviceDataSync()
    resetBackend()
    bumpAuth()
    router.replace('/auth')
  }, [router, bumpAuth])

  const contextValue = {
    isAuthenticated: authenticated,
    needsSetup,
    setupPin: setupPinFn,
    login,
    logout,
  }

  if (!ready && (isPublicRoute || isOnboardingRoute)) {
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  }

  if (!ready) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Loading…</div>
      </div>
    )
  }

  if (isPublicRoute) {
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  }

  if (isOnboardingRoute) {
    if (!hasAccount || needsSetup || !isUnlocked()) {
      return (
        <div className="auth-loading-screen">
          <div className="auth-loading-text">Redirecting…</div>
        </div>
      )
    }
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  }

  if (!authenticated && !needsSetup && hasAccount) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Locked</div>
      </div>
    )
  }

  if (!hasAccount || needsSetup || !isUnlocked()) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Redirecting…</div>
      </div>
    )
  }

  if (needsOnboarding) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Redirecting…</div>
      </div>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
