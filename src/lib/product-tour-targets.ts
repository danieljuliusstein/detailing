export const PRODUCT_TOUR_TARGETS = [
  'week-strip',
  'today-jobs',
  'fab',
  'nav-jobs',
  'nav-clients',
  'nav-reports',
  'header-pipeline',
  'profile-complete',
  'settings',
] as const

export type ProductTourTarget = (typeof PRODUCT_TOUR_TARGETS)[number]

export function tourSelector(target: ProductTourTarget): string {
  return `[data-tour="${target}"]`
}
