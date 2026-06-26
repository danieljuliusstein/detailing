import { describe, expect, it } from 'vitest'
import { countMatchingSettingsSections, matchesSettingsSearch } from './settings-search'

describe('settings search', () => {
  it('matches empty query to everything', () => {
    expect(matchesSettingsSearch('', ['Your business', 'logo'])).toBe(true)
  })

  it('matches multi-word queries when all tokens appear', () => {
    expect(matchesSettingsSearch('business logo', ['Your business', 'logo', 'brand'])).toBe(true)
  })

  it('matches partial tokens', () => {
    expect(matchesSettingsSearch('notif', ['App preferences', 'notification'])).toBe(true)
  })

  it('returns no sections for nonsense query', () => {
    expect(countMatchingSettingsSections('zzzznotfound')).toBe(0)
  })

  it('finds business section by company or logo', () => {
    expect(countMatchingSettingsSections('logo')).toBeGreaterThan(0)
    expect(countMatchingSettingsSections('company')).toBeGreaterThan(0)
  })
})
