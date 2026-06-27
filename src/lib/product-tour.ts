import type { DriveStep } from 'driver.js'
import {
  PRODUCT_TOUR_REQUIRED_TARGETS,
  buildTourSteps,
} from './product-tour-steps'
import { tourSelector, type ProductTourTarget } from './product-tour-targets'
import { getPocketBase } from './pocketbase'

export { PRODUCT_TOUR_TARGETS, tourSelector, type ProductTourTarget } from './product-tour-targets'
export { PRODUCT_TOUR_REQUIRED_TARGETS, buildTourSteps } from './product-tour-steps'

export const TOUR_COMPLETED_KEY = 'detailing_product_tour_completed'
export const TOUR_PENDING_KEY = 'detailing_product_tour_pending'
export const TOUR_REPLAY_KEY = 'detailing_product_tour_replay'
export const TOUR_WELCOME_DISMISSED_KEY = 'detailing_product_tour_welcome_dismissed'
export const TOUR_REPLAY_EVENT = 'detailing-product-tour-replay'

function getTourUserId(): string | null {
  if (typeof window === 'undefined') return null
  const id = getPocketBase()?.authStore.record?.id
  return id ? String(id) : null
}

function scopedKey(base: string): string {
  const userId = getTourUserId()
  return userId ? `${base}_${userId}` : base
}

function canUseTourStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export function isTourCompleted(): boolean {
  if (!canUseTourStorage()) return true
  return localStorage.getItem(scopedKey(TOUR_COMPLETED_KEY)) === '1'
}

export function markTourPending(): void {
  if (!canUseTourStorage()) return
  const pendingKey = scopedKey(TOUR_PENDING_KEY)
  const completedKey = scopedKey(TOUR_COMPLETED_KEY)
  localStorage.removeItem(completedKey)
  sessionStorage.removeItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY))
  localStorage.setItem(pendingKey, '1')
}

export function markTourCompleted(): void {
  if (!canUseTourStorage()) return
  localStorage.setItem(scopedKey(TOUR_COMPLETED_KEY), '1')
  localStorage.removeItem(scopedKey(TOUR_PENDING_KEY))
  sessionStorage.removeItem(scopedKey(TOUR_REPLAY_KEY))
}

export function requestTourReplay(): void {
  if (!canUseTourStorage()) return
  sessionStorage.setItem(scopedKey(TOUR_REPLAY_KEY), '1')
}

export function isTourReplaySession(): boolean {
  if (!canUseTourStorage()) return false
  return sessionStorage.getItem(scopedKey(TOUR_REPLAY_KEY)) === '1'
}

export function dismissTourWelcome(): void {
  if (!canUseTourStorage()) return
  sessionStorage.setItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY), '1')
}

export function shouldAutoStartTour(): boolean {
  if (!canUseTourStorage()) return false
  if (sessionStorage.getItem(scopedKey(TOUR_REPLAY_KEY)) === '1') return true
  return localStorage.getItem(scopedKey(TOUR_PENDING_KEY)) === '1' && !isTourCompleted()
}

export function shouldShowTourWelcome(): boolean {
  if (!shouldAutoStartTour()) return false
  if (isTourReplaySession()) return false
  return sessionStorage.getItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY)) !== '1'
}

export async function waitForTourTargets(maxMs = 8000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const ready = PRODUCT_TOUR_REQUIRED_TARGETS.every((target) =>
      document.querySelector(tourSelector(target)),
    )
    if (ready) return true
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return PRODUCT_TOUR_REQUIRED_TARGETS.every((target) => document.querySelector(tourSelector(target)))
}

function scrollHomeToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

let activeDriver: {
  destroy: () => void
  refresh: () => void
  isActive: () => boolean
} | null = null

let viewportListener: (() => void) | null = null

function attachViewportRefresh(refresh: () => void): void {
  detachViewportRefresh()
  const vv = window.visualViewport
  if (!vv) return

  const handler = () => {
    if (!activeDriver?.isActive()) return
    requestAnimationFrame(refresh)
  }

  vv.addEventListener('resize', handler)
  vv.addEventListener('scroll', handler)
  window.addEventListener('orientationchange', handler)
  viewportListener = () => {
    vv.removeEventListener('resize', handler)
    vv.removeEventListener('scroll', handler)
    window.removeEventListener('orientationchange', handler)
    viewportListener = null
  }
}

function detachViewportRefresh(): void {
  viewportListener?.()
  viewportListener = null
}

function buildDriverSteps(): DriveStep[] {
  const includeProfileStep = Boolean(document.querySelector(tourSelector('profile-complete')))

  const dockHooks = () => ({
    onHighlightStarted: () => {
      scrollHomeToTop()
      requestAnimationFrame(() => activeDriver?.refresh())
    },
    onHighlighted: () => {
      requestAnimationFrame(() => activeDriver?.refresh())
    },
  })

  return buildTourSteps({
    includeProfileStep,
    dockHooks,
  })
}

export async function startProductTour(): Promise<boolean> {
  if (typeof document === 'undefined') return false

  const ready = await waitForTourTargets()
  if (!ready) return false

  scrollHomeToTop()

  const { driver } = await import('driver.js')
  await import('driver.js/dist/driver.css')

  activeDriver?.destroy()

  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    allowClose: true,
    allowScroll: true,
    smoothScroll: false,
    overlayOpacity: 0.72,
    stagePadding: 8,
    stageRadius: 12,
    popoverOffset: 10,
    popoverClass: 'driver-popover--rinse',
    disableActiveInteraction: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    onHighlightStarted: () => {
      requestAnimationFrame(() => driverObj.refresh())
    },
    onDestroyed: () => {
      detachViewportRefresh()
      markTourCompleted()
      scrollHomeToTop()
      activeDriver = null
    },
    steps: buildDriverSteps(),
  })

  activeDriver = driverObj
  attachViewportRefresh(() => driverObj.refresh())
  driverObj.drive()
  return true
}

export function destroyProductTour(): void {
  detachViewportRefresh()
  activeDriver?.destroy()
  activeDriver = null
}

export function skipProductTour(): void {
  dismissTourWelcome()
  markTourCompleted()
  destroyProductTour()
}
