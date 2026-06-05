'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resetBackend, syncOnReconnect } from '@/lib/api'
import {
  hasPinSet,
  isUnlocked,
  lock,
  setPin,
  touchActivity,
  unlock,
  verifyPin,
} from '@/lib/auth'
import { authenticatePocketBase, clearPocketBaseAuth } from '@/lib/pb-auth'

interface AuthContextValue {
  isAuthenticated: boolean
  needsSetup: boolean
  setupPin: (pin: string) => Promise<void>
  login: (pin: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTick, setAuthTick] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const bumpAuth = useCallback(() => setAuthTick((t) => t + 1), [])

  const ready = mounted
  // authTick forces re-read of localStorage pin state after login/logout
  void authTick
  const needsSetup = mounted && !hasPinSet()
  const authenticated = mounted && hasPinSet() && isUnlocked()

  useEffect(() => {
    if (!ready) return

    const onActivity = () => {
      if (authenticated) touchActivity()
    }

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const interval = setInterval(() => {
      if (!hasPinSet()) return
      if (!isUnlocked()) {
        bumpAuth()
        router.replace('/auth')
      }
    }, 30_000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(interval)
    }
  }, [ready, authenticated, router, bumpAuth])

  useEffect(() => {
    if (!ready) return
    if (pathname === '/auth') return

    if (needsSetup) {
      router.replace('/auth')
      return
    }

    if (!authenticated) {
      router.replace('/auth')
    }
  }, [ready, authenticated, needsSetup, pathname, router])

  const syncPocketBaseInBackground = useCallback(() => {
    void (async () => {
      try {
        await authenticatePocketBase()
        await syncOnReconnect()
      } catch {
        // fall back to local data — initBackend handles this on next request
      } finally {
        resetBackend()
      }
    })()
  }, [])

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
    resetBackend()
    bumpAuth()
    router.replace('/auth')
  }, [router, bumpAuth])

  if (!ready) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Loading…</div>
      </div>
    )
  }

  if (pathname === '/auth') {
    return (
      <AuthContext.Provider value={{ isAuthenticated: authenticated, needsSetup, setupPin: setupPinFn, login, logout }}>
        {children}
      </AuthContext.Provider>
    )
  }

  if (!authenticated && !needsSetup) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Locked</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: authenticated, needsSetup, setupPin: setupPinFn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
