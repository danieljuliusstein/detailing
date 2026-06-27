import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { syncLeadForQuoteJob, createLead, updateLead, getLead } from './leads-local'
import { newId, saveData, createSeedData } from '../storage'
import { leadStageLabel } from '../lead-sources'

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

describe('leadStageLabel', () => {
  it('labels booked stage for operators', () => {
    expect(leadStageLabel('booked')).toBe('Ready to schedule')
  })
})

describe('syncLeadForQuoteJob', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('window', {} as Window)
    saveData(createSeedData())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('links pipeline lead when quote becomes a job', () => {
    const quoteId = newId()
    const jobId = newId()

    const lead = createLead({
      name: 'Jordan P.',
      source: 'referral',
      vehicle_type: 'suv',
      stage: 'quoted',
    })

    updateLead(lead.id, { quote_id: quoteId })

    syncLeadForQuoteJob(quoteId, jobId)

    const updated = getLead(lead.id)
    expect(updated?.job_id).toBe(jobId)
    expect(updated?.stage).toBe('booked')
  })
})
