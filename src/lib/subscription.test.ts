import { describe, expect, it } from 'vitest'
import { isSubscriptionActive, trialDaysLeft } from './subscription'

describe('subscription', () => {
  it('allows founding members', () => {
    expect(isSubscriptionActive({ plan: 'founding', founding_member: true, subscription_status: 'none' })).toBe(true)
  })

  it('allows active and trialing within trial window', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const trialEnd = future.toISOString().slice(0, 10)
    expect(
      isSubscriptionActive({
        plan: 'starter',
        founding_member: false,
        subscription_status: 'trialing',
        trial_ends_at: trialEnd,
      }),
    ).toBe(true)
    expect(trialDaysLeft({ plan: 'starter', founding_member: false, subscription_status: 'trialing', trial_ends_at: trialEnd })).toBeGreaterThan(0)
  })

  it('blocks expired trial', () => {
    expect(
      isSubscriptionActive({
        plan: 'starter',
        founding_member: false,
        subscription_status: 'trialing',
        trial_ends_at: '2020-01-01',
      }),
    ).toBe(false)
  })
})
