import { describe, expect, it } from 'vitest'
import { buildTourSteps } from './product-tour-steps'
import { tourSelector } from './product-tour-targets'

const noopHooks = () => ({
  onHighlightStarted: () => {},
  onHighlighted: () => {},
})

describe('buildTourSteps', () => {
  it('builds 10 steps without profile card', () => {
    const steps = buildTourSteps({ includeProfileStep: false, dockHooks: noopHooks })
    expect(steps).toHaveLength(10)
    expect(steps[0].popover?.title).toBe('Welcome to Rinse')
    expect(steps[steps.length - 1].popover?.title).toBe('You’re all set')
  })

  it('adds profile step before settings when included', () => {
    const steps = buildTourSteps({ includeProfileStep: true, dockHooks: noopHooks })
    expect(steps).toHaveLength(11)
    const settingsIndex = steps.findIndex((s) => s.element === tourSelector('settings'))
    const profileIndex = steps.findIndex((s) => s.element === tourSelector('profile-complete'))
    expect(profileIndex).toBeGreaterThan(-1)
    expect(profileIndex).toBe(settingsIndex - 1)
  })

  it('includes all required spotlight targets', () => {
    const steps = buildTourSteps({ includeProfileStep: false, dockHooks: noopHooks })
    const elements = steps.map((s) => s.element).filter(Boolean)
    expect(elements).toContain(tourSelector('week-strip'))
    expect(elements).toContain(tourSelector('today-jobs'))
    expect(elements).toContain(tourSelector('fab'))
    expect(elements).toContain(tourSelector('nav-reports'))
    expect(elements).toContain(tourSelector('header-pipeline'))
  })
})
