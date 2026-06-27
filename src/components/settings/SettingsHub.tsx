'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { useMilestones } from '@/hooks/useMilestones'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { MILESTONE_COUNT } from '@/lib/milestones'
import { searchSettings, type SettingsSearchResult } from '@/lib/settings-search'
import SettingsFooter from './SettingsFooter'
import ProfileCompleteCard from '@/components/home/ProfileCompleteCard'
import { useAuth } from '@/providers/AuthProvider'
import {
  SETTINGS_MENU_GROUPS,
  SETTINGS_MENU_ITEMS,
  type SettingsMenuItem,
} from '@/lib/settings-menu'

function SearchResultRow({
  result,
  onSelect,
  profileCompletion,
  hasUnviewed,
  unlockedCount,
}: {
  result: SettingsSearchResult
  onSelect: (href: string) => void
  profileCompletion: ReturnType<typeof useProfileCompletion>
  hasUnviewed: boolean
  unlockedCount: number
}) {
  const Icon = result.Icon ?? result.menuItem?.Icon
  const tone = result.tone ?? result.menuItem?.tone ?? 'blue'
  const itemId = result.menuItem?.id

  return (
    <button
      type="button"
      className="settings-menu-item"
      onClick={() => onSelect(result.href)}
    >
      {Icon ? (
        <span className={`settings-menu-icon settings-menu-icon--${tone}`}>
          <Icon size={18} weight="duotone" aria-hidden="true" />
        </span>
      ) : null}
      <span className="settings-menu-text">
        <span className="settings-menu-title">{result.title}</span>
        <span className="settings-menu-sub">
          {result.matchHint ?? result.subtitle}
        </span>
      </span>
      {result.kind === 'faq' ? (
        <span className="settings-search-kind-badge">FAQ</span>
      ) : null}
      {itemId === 'business' && profileCompletion && !profileCompletion.isComplete ? (
        <span className="settings-menu-profile-badge">
          {profileCompletion.totalCount - profileCompletion.completedCount} left
        </span>
      ) : null}
      {itemId === 'progress' && hasUnviewed ? (
        <span className="settings-menu-milestone-badge">
          {unlockedCount}/{MILESTONE_COUNT}
        </span>
      ) : null}
      <CaretRight size={16} className="settings-menu-chevron" aria-hidden="true" />
    </button>
  )
}

function MenuItemRow({
  item,
  onSelect,
  profileCompletion,
  hasUnviewed,
  unlockedCount,
}: {
  item: SettingsMenuItem
  onSelect: (href: string) => void
  profileCompletion: ReturnType<typeof useProfileCompletion>
  hasUnviewed: boolean
  unlockedCount: number
}) {
  const Icon = item.Icon

  return (
    <button
      type="button"
      className="settings-menu-item"
      onClick={() => onSelect(item.href)}
    >
      <span className={`settings-menu-icon settings-menu-icon--${item.tone}`}>
        <Icon size={18} weight="duotone" aria-hidden="true" />
      </span>
      <span className="settings-menu-text">
        <span className="settings-menu-title">{item.title}</span>
        <span className="settings-menu-sub">{item.subtitle}</span>
      </span>
      {item.id === 'business' && profileCompletion && !profileCompletion.isComplete ? (
        <span className="settings-menu-profile-badge">
          {profileCompletion.totalCount - profileCompletion.completedCount} left
        </span>
      ) : null}
      {item.id === 'progress' && hasUnviewed ? (
        <span className="settings-menu-milestone-badge">
          {unlockedCount}/{MILESTONE_COUNT}
        </span>
      ) : null}
      <CaretRight size={16} className="settings-menu-chevron" aria-hidden="true" />
    </button>
  )
}

export default function SettingsHub() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const goBack = useSettingsBack()
  const [searchQuery, setSearchQuery] = useState('')
  const { hasUnviewed, unlockedCount } = useMilestones()
  const profileCompletion = useProfileCompletion()
  const searchResults = useMemo(() => searchSettings(searchQuery), [searchQuery])
  const searching = searchQuery.trim().length > 0
  const showingSimilar = searching && searchResults.length > 0 && searchResults.every((r) => r.similar)

  const navigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Settings</h1>
      </header>

      {isLoggedIn && profileCompletion && !profileCompletion.isComplete ? (
        <ProfileCompleteCard completion={profileCompletion} compact />
      ) : null}

      <div className="settings-search-field premium-search">
        <MagnifyingGlass size={16} className="premium-search__icon settings-search-field__icon" aria-hidden="true" />
        <input
          type="search"
          className="premium-search__input settings-search-field__input"
          placeholder="Search settings, help, pipeline…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search settings"
        />
      </div>

      {searching && searchResults.length === 0 ? (
        <p className="settings-search-empty">
          No settings match &ldquo;{searchQuery.trim()}&rdquo;. Try words like booking, pipeline, stripe, or messages.
        </p>
      ) : null}

      <div className="settings-hub">
        {searching ? (
          <section className="settings-hub__section">
            <h2 className="settings-hub__label">
              {showingSimilar ? 'Similar matches' : 'Results'}
            </h2>
            <div className="settings-menu-group">
              {searchResults.map((result) => (
                <SearchResultRow
                  key={`${result.kind}-${result.href}-${result.title}`}
                  result={result}
                  onSelect={navigate}
                  profileCompletion={profileCompletion}
                  hasUnviewed={hasUnviewed}
                  unlockedCount={unlockedCount}
                />
              ))}
            </div>
          </section>
        ) : (
          SETTINGS_MENU_GROUPS.map((group) => {
            const items = SETTINGS_MENU_ITEMS.filter((item) => item.group === group.id)
            if (items.length === 0) return null

            return (
              <section key={group.id} className="settings-hub__section">
                <h2 className="settings-hub__label">{group.label}</h2>
                <div className="settings-menu-group">
                  {items.map((item) => (
                    <MenuItemRow
                      key={item.id}
                      item={item}
                      onSelect={navigate}
                      profileCompletion={profileCompletion}
                      hasUnviewed={hasUnviewed}
                      unlockedCount={unlockedCount}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      <SettingsFooter />
    </div>
  )
}
