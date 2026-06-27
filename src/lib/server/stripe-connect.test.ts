import { describe, expect, it } from 'vitest'
import { connectStatusFromAccount } from './stripe-connect'

describe('connectStatusFromAccount', () => {
  it('marks ready when charges and details are submitted', () => {
    const status = connectStatusFromAccount({
      id: 'acct_test',
      charges_enabled: true,
      details_submitted: true,
    } as never)
    expect(status.ready).toBe(true)
    expect(status.accountId).toBe('acct_test')
  })

  it('is not ready when onboarding incomplete', () => {
    const status = connectStatusFromAccount({
      id: 'acct_test',
      charges_enabled: false,
      details_submitted: false,
    } as never)
    expect(status.ready).toBe(false)
  })
})
