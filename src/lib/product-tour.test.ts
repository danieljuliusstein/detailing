import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOUR_PENDING_KEY,
  isTourCompleted,
  markTourCompleted,
  markTourPending,
  requestTourReplay,
  shouldAutoStartTour,
  tourSelector,
} from './product-tour'

function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('product-tour storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('sessionStorage', createStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds stable tour selectors', () => {
    expect(tourSelector('fab')).toBe('[data-tour="fab"]')
  })

  it('auto-starts when pending and not completed', () => {
    markTourPending()
    expect(shouldAutoStartTour()).toBe(true)
    expect(isTourCompleted()).toBe(false)
  })

  it('does not auto-start after completion', () => {
    markTourPending()
    markTourCompleted()
    expect(shouldAutoStartTour()).toBe(false)
    expect(isTourCompleted()).toBe(true)
    expect(localStorage.getItem(TOUR_PENDING_KEY)).toBeNull()
  })

  it('replays when requested in session', () => {
    markTourCompleted()
    requestTourReplay()
    expect(shouldAutoStartTour()).toBe(true)
  })
})
