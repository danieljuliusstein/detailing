'use client'

import { FloppyDisk } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsFooter({ showSave = true }: { showSave?: boolean }) {
  const { logout, isLoggedIn } = useAuth()
  const { handleWriteError } = useActionToast()
  const { dirty, savedFlash, save } = useSettingsDraft()
  const router = useRouter()

  return (
    <div className="settings-footer">
      {showSave && isLoggedIn ? (
        <button
          type="button"
          className="settings-footer__save"
          disabled={!dirty && !savedFlash}
          onClick={() => {
            void (async () => {
              try {
                await save()
              } catch (e) {
                handleWriteError(e)
              }
            })()
          }}
        >
          <FloppyDisk size={18} weight="bold" aria-hidden="true" />
          {savedFlash ? 'Saved!' : 'Save settings'}
        </button>
      ) : null}
      {isLoggedIn ? (
        <button
          type="button"
          className="settings-footer__logout"
          onClick={() => {
            if (!confirm('Log out on this device? You can keep browsing, but your data will not load until you sign in again.')) return
            logout()
          }}
        >
          Log out
        </button>
      ) : (
        <button
          type="button"
          className="settings-footer__save"
          onClick={() => router.push('/auth')}
        >
          Sign in
        </button>
      )}
    </div>
  )
}
