'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resetBackend, syncOnReconnect } from '@/lib/api'
import { clearLocalDeviceDataSync } from '@/lib/clear-local-data'
import {
  authenticatePocketBase,
  clearPocketBaseAuth,
  isPocketBaseAuthenticated,
} from '@/lib/pb-auth'
import { getCurrentOrganizationId } from '@/lib/tenant'
import { getPocketBase } from '@/lib/pocketbase'
import { isSubscriptionActive, type OrgSubscription } from '@/lib/subscription'

interface AuthContextValue {
  isLoggedIn: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
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

function isBillingGracePath(pathname: string): boolean {
  return (
    pathname === '/settings/billing' ||
    pathname === '/settings/access' ||
    pathname === '/settings/support' ||
    pathname === '/privacy' ||
    pathname.startsWith('/settings/faq')
  )
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin'
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding'
}

function safeReplace(router: ReturnType<typeof useRouter>, href: string) {
  queueMicrotask(() => {
    try {
      router.replace(href)
    } catch {
      // Router may not be ready during hydration
    }
  })
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

  const isLoggedIn = mounted && isPocketBaseAuthenticated()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false)

  const isPublicRoute = isPublicPath(pathname)
  const isOnboardingRoute = isOnboardingPath(pathname)

  useEffect(() => {
    if (!mounted || !isLoggedIn || isOnboardingPath(pathname)) return
    let cancelled = false
    void (async () => {
      try {
        const { loadSettingsFromPocketBase } = await import('@/lib/api/settings-pocketbase')
        const settings = await loadSettingsFromPocketBase()
        if (cancelled) return
        if (settings && !settings.business_phone?.trim()) {
          setNeedsOnboarding(true)
          safeReplace(router, '/onboarding')
        } else {
          setNeedsOnboarding(false)
        }
      } catch {
        if (!cancelled) setNeedsOnboarding(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, isLoggedIn, pathname, router])

  useEffect(() => {
    if (!mounted || !isLoggedIn || isPublicPath(pathname) || isOnboardingPath(pathname)) return
    let cancelled = false
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (!orgId || !pb?.authStore.isValid) {
          if (!cancelled) setSubscriptionBlocked(false)
          return
        }
        const org = await pb.collection('organizations').getOne(orgId)
        if (cancelled) return
        const sub: OrgSubscription = {
          plan: String(org.plan ?? ''),
          founding_member: org.founding_member === true,
          subscription_status: String(org.subscription_status ?? 'none'),
          trial_ends_at: org.trial_ends_at ? String(org.trial_ends_at) : undefined,
        }
        const blocked = !isSubscriptionActive(sub)
        setSubscriptionBlocked(blocked)
        if (blocked && !isBillingGracePath(pathname) && !isAdminPath(pathname)) {
          safeReplace(router, '/settings/billing')
        }
      } catch {
        if (!cancelled) setSubscriptionBlocked(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, isLoggedIn, pathname, router])

  useEffect(() => {
    if (!ready || isPublicRoute || !isOnboardingRoute || isLoggedIn) return
    safeReplace(router, '/')
  }, [ready, isLoggedIn, router, isPublicRoute, isOnboardingRoute])

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
    if (!ready || !isLoggedIn) return
    syncPocketBaseInBackground()
  }, [ready, isLoggedIn, syncPocketBaseInBackground])

  useEffect(() => {
    if (!ready || !isLoggedIn || pathname !== '/auth') return
    if (needsOnboarding) {
      safeReplace(router, '/onboarding')
      return
    }
    safeReplace(router, '/')
  }, [ready, isLoggedIn, needsOnboarding, pathname, router])

  const logout = useCallback(() => {
    clearPocketBaseAuth()
    void clearLocalDeviceDataSync()
    resetBackend()
    bumpAuth()
    safeReplace(router, '/')
  }, [router, bumpAuth])

  const contextValue: AuthContextValue = {
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    needsOnboarding,
    logout,
  }

  const showBlockingRedirect =
    !ready ||
    (isOnboardingRoute && !isLoggedIn) ||
    (isLoggedIn && needsOnboarding && !isOnboardingRoute && !isPublicRoute) ||
    (isLoggedIn &&
      subscriptionBlocked &&
      !isBillingGracePath(pathname) &&
      !isAdminPath(pathname) &&
      !isPublicRoute)

  return (
    <AuthContext.Provider value={contextValue}>
      {showBlockingRedirect ? (
        <div className="auth-loading-screen">
          <div className="auth-loading-text">{ready ? 'Redirecting…' : 'Loading…'}</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
