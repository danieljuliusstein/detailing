export const TOUR_COMPLETED_KEY = 'detailing_product_tour_completed'
export const TOUR_PENDING_KEY = 'detailing_product_tour_pending'
export const TOUR_REPLAY_KEY = 'detailing_product_tour_replay'

export const PRODUCT_TOUR_TARGETS = [
  'home',
  'fab',
  'nav-jobs',
  'nav-clients',
  'settings',
] as const

export type ProductTourTarget = (typeof PRODUCT_TOUR_TARGETS)[number]

export function tourSelector(target: ProductTourTarget): string {
  return `[data-tour="${target}"]`
}

function canUseTourStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export function isTourCompleted(): boolean {
  if (!canUseTourStorage()) return true
  return localStorage.getItem(TOUR_COMPLETED_KEY) === '1'
}

export function markTourPending(): void {
  if (!canUseTourStorage()) return
  localStorage.setItem(TOUR_PENDING_KEY, '1')
}

export function markTourCompleted(): void {
  if (!canUseTourStorage()) return
  localStorage.setItem(TOUR_COMPLETED_KEY, '1')
  localStorage.removeItem(TOUR_PENDING_KEY)
  sessionStorage.removeItem(TOUR_REPLAY_KEY)
}

export function requestTourReplay(): void {
  if (!canUseTourStorage()) return
  sessionStorage.setItem(TOUR_REPLAY_KEY, '1')
}

export function shouldAutoStartTour(): boolean {
  if (!canUseTourStorage()) return false
  if (sessionStorage.getItem(TOUR_REPLAY_KEY) === '1') return true
  return localStorage.getItem(TOUR_PENDING_KEY) === '1' && !isTourCompleted()
}

export async function waitForTourTargets(maxMs = 8000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const ready = PRODUCT_TOUR_TARGETS.every((target) => document.querySelector(tourSelector(target)))
    if (ready) return true
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return PRODUCT_TOUR_TARGETS.every((target) => document.querySelector(tourSelector(target)))
}

let activeDriver: { destroy: () => void } | null = null

export async function startProductTour(): Promise<boolean> {
  if (typeof document === 'undefined') return false

  const ready = await waitForTourTargets()
  if (!ready) return false

  const { driver } = await import('driver.js')
  await import('driver.js/dist/driver.css')

  activeDriver?.destroy()

  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    allowClose: true,
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 10,
    popoverOffset: 12,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    onDestroyed: () => {
      markTourCompleted()
      activeDriver = null
    },
    steps: [
      {
        element: tourSelector('home'),
        popover: {
          title: 'Your dashboard',
          description: 'See today’s jobs, weekly stats, and what’s coming up at a glance.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: tourSelector('fab'),
        popover: {
          title: 'Quick actions',
          description: 'Tap + to add a job, quote, client, expense, or supply purchase.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: tourSelector('nav-jobs'),
        popover: {
          title: 'Jobs',
          description: 'Track every job from scheduled through done.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: tourSelector('nav-clients'),
        popover: {
          title: 'Clients',
          description: 'Your client list, vehicles, and follow-ups live here.',
          side: 'top',
          align: 'end',
        },
      },
      {
        element: tourSelector('settings'),
        popover: {
          title: 'Settings',
          description: 'Update your booking link, logo, packages, and business details.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  })

  activeDriver = driverObj
  driverObj.drive()
  return true
}

export function destroyProductTour(): void {
  activeDriver?.destroy()
  activeDriver = null
}
