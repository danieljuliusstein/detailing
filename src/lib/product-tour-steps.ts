import type { DriveStep } from 'driver.js'
import { tourSelector, type ProductTourTarget } from './product-tour-targets'

export type { ProductTourTarget }

/** Targets that must exist on the home screen before the tour starts. */
export const PRODUCT_TOUR_REQUIRED_TARGETS = [
  'week-strip',
  'today-jobs',
  'fab',
  'nav-jobs',
  'nav-clients',
  'nav-reports',
  'header-pipeline',
  'settings',
] as const satisfies readonly ProductTourTarget[]

export const PRODUCT_TOUR_OPTIONAL_TARGETS = ['profile-complete'] as const satisfies readonly ProductTourTarget[]

export interface BuildTourStepsOptions {
  includeProfileStep: boolean
  dockHooks: () => Pick<DriveStep, 'onHighlightStarted' | 'onHighlighted'>
}

export function buildTourSteps(options: BuildTourStepsOptions): DriveStep[] {
  const dock = options.dockHooks()

  const steps: DriveStep[] = [
    {
      popover: {
        title: 'Welcome to Rinse',
        description:
          'A quick tour of your dashboard — jobs, clients, money, and how to add work in seconds.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: tourSelector('week-strip'),
      popover: {
        title: 'Your week at a glance',
        description:
          'Weekly stats sit up top. Tap any day to see that day’s jobs — blocked days are grayed out.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: tourSelector('today-jobs'),
      popover: {
        title: 'Today’s jobs',
        description:
          'Your next appointment shows here with directions and a shortcut to start the job.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: tourSelector('fab'),
      ...dock,
      popover: {
        title: 'Quick actions',
        description:
          'Tap + to add a new job, capture a lead, send a quote, or log expenses and supply purchases.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: tourSelector('nav-jobs'),
      ...dock,
      popover: {
        title: 'Jobs',
        description: 'Search and filter every job from scheduled through paid.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: tourSelector('nav-clients'),
      ...dock,
      popover: {
        title: 'Clients',
        description: 'Your client list, follow-ups, and vehicle history live here.',
        side: 'top',
        align: 'end',
      },
    },
    {
      element: tourSelector('nav-reports'),
      ...dock,
      popover: {
        title: 'Money',
        description: 'Revenue, expenses, profit, and exports — your P&L hub.',
        side: 'top',
        align: 'end',
      },
    },
    {
      element: tourSelector('header-pipeline'),
      popover: {
        title: 'Lead pipeline',
        description: 'Track inquiries before they become clients — move leads as they book.',
        side: 'bottom',
        align: 'end',
      },
    },
  ]

  if (options.includeProfileStep) {
    steps.push({
      element: tourSelector('profile-complete'),
      popover: {
        title: 'Complete your profile',
        description:
          'Add your business email and logo so invoices and your booking page look professional.',
        side: 'bottom',
        align: 'start',
      },
    })
  }

  steps.push({
    element: tourSelector('settings'),
    popover: {
      title: 'Settings',
      description:
        'Your booking link, logo, packages, schedule, and invoicing — set these up when you’re ready.',
      side: 'bottom',
      align: 'end',
    },
  })

  steps.push({
    popover: {
      title: 'You’re all set',
      description:
        'Share your booking link from Settings when you want to go live. Replay this tour anytime under Help & support.',
      side: 'top',
      align: 'center',
    },
  })

  return steps
}
