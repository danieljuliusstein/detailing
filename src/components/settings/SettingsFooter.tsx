'use client'

import { FloppyDisk } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsFooter({ showSave = true }: { showSave?: boolean }) {
  const { logout } = useAuth()
  const { dirty, savedFlash, save } = useSettingsDraft()

  return (
    <div className="settings-footer">
      {showSave ? (
        <button
          type="button"
          className="settings-footer__save"
          disabled={!dirty && !savedFlash}
          onClick={() => void save()}
        >
          <FloppyDisk size={18} weight="bold" aria-hidden="true" />
          {savedFlash ? 'Saved!' : 'Save settings'}
        </button>
      ) : null}
      <button
        type="button"
        className="settings-footer__logout"
        onClick={() => {
          if (!confirm('Log out on this device? You will need your email, password, and PIN to sign in again.')) return
          logout()
        }}
      >
        Log out
      </button>
    </div>
  )
}
