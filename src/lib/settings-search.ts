import { SETTINGS_MENU_ITEMS } from './settings-menu'

/** Match settings search query against section title, description, and keyword list. */
export function matchesSettingsSearch(query: string, parts: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (haystack.includes(q)) return true

  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

export function countMatchingSettingsSections(query: string): number {
  return SETTINGS_MENU_ITEMS.filter((item) =>
    matchesSettingsSearch(query, [item.title, item.subtitle, item.group, ...item.searchKeys])
  ).length
}
