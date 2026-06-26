'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { matchesSettingsSearch } from '@/lib/settings-search'
import SettingsFooter from './SettingsFooter'
import {
  SETTINGS_MENU_GROUPS,
  SETTINGS_MENU_ITEMS,
  type SettingsMenuItem,
} from '@/lib/settings-menu'

function filterMenuItems(query: string): SettingsMenuItem[] {
  return SETTINGS_MENU_ITEMS.filter((item) =>
    matchesSettingsSearch(query, [item.title, item.subtitle, item.group, ...item.searchKeys])
  )
}

export default function SettingsHub() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const filtered = useMemo(() => filterMenuItems(searchQuery), [searchQuery])
  const searching = searchQuery.trim().length > 0

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={() => router.back()} />
        <h1 className="settings-header__title">Settings</h1>
      </header>

      <div className="settings-search-field">
        <MagnifyingGlass size={16} className="settings-search-field__icon" aria-hidden="true" />
        <input
          type="search"
          className="settings-search-field__input"
          placeholder="Search settings…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search settings"
        />
      </div>

      {searching && filtered.length === 0 ? (
        <p className="settings-search-empty">No settings match &ldquo;{searchQuery.trim()}&rdquo;</p>
      ) : null}

      <div className="settings-hub">
        {SETTINGS_MENU_GROUPS.map((group) => {
          const items = filtered.filter((item) => item.group === group.id)
          if (items.length === 0) return null

          return (
            <section key={group.id} className="settings-hub__section">
              <h2 className="settings-hub__label">{group.label}</h2>
              <div className="settings-menu-group">
                {items.map((item) => {
                  const Icon = item.Icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="settings-menu-item"
                      onClick={() => router.push(item.href)}
                    >
                      <span className={`settings-menu-icon settings-menu-icon--${item.tone}`}>
                        <Icon size={18} weight="duotone" aria-hidden="true" />
                      </span>
                      <span className="settings-menu-text">
                        <span className="settings-menu-title">{item.title}</span>
                        <span className="settings-menu-sub">{item.subtitle}</span>
                      </span>
                      <CaretRight size={16} className="settings-menu-chevron" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <SettingsFooter />
    </div>
  )
}
