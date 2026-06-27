'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight } from '@phosphor-icons/react'
import {
  isPushEnabled,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client'
import { requestTourReplay, TOUR_REPLAY_EVENT } from '@/lib/product-tour'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="settings-toggle"
    >
      <span className={`settings-toggle__track${on ? ' settings-toggle__track--on' : ''}`}>
        <span className="settings-toggle__thumb" />
      </span>
    </button>
  )
}

export default function SettingsPreferencesPage() {
  const router = useRouter()
  const { settings, ready, update } = useSettingsDraft()
  const [pushOn, setPushOn] = useState(false)
  const [pushMsg, setPushMsg] = useState<string | null>(null)

  useEffect(() => {
    setPushOn(isPushEnabled())
  }, [])

  const handlePushToggle = async () => {
    setPushMsg(null)
    if (pushOn) {
      await unsubscribeFromPush()
      setPushOn(false)
      setPushMsg('Push notifications disabled')
      return
    }
    const result = await subscribeToPush()
    if (result.ok) {
      setPushOn(true)
      setPushMsg('Push notifications enabled')
    } else {
      setPushMsg(result.error ?? 'Failed to enable push')
    }
  }

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="App preferences">
      <div className="settings-panel settings-panel--flush">
        {(
          [
            ['job_reminder', 'Job reminder (day before)'],
            ['morning_reminder', 'Morning reminder'],
            ['follow_up', 'Follow-up (3 days after)'],
            ['invoice_overdue', 'Invoice overdue'],
            ['low_inventory', 'Low inventory'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="settings-toggle-row">
            <span className="settings-toggle-row__label">{label}</span>
            <Toggle
              on={settings.notifications[key]}
              onChange={(v) => update('notifications', { ...settings.notifications, [key]: v })}
            />
          </div>
        ))}
        <div className="settings-divider" />
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Track supplies on jobs</div>
            <div className="settings-toggle-row__hint">
              Prompt to log product used when saving a job. Off by default.
            </div>
          </div>
          <Toggle
            on={settings.track_job_supplies === true}
            onChange={(v) => update('track_job_supplies', v)}
          />
        </div>
        <div className="settings-divider" />
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Push notifications</div>
            <div className="settings-toggle-row__hint">
              {isPushSupported() ? (pushOn ? 'Subscribed on this device' : 'Not subscribed') : 'Not supported on this device'}
            </div>
          </div>
          <Toggle on={pushOn} onChange={() => void handlePushToggle()} />
        </div>
        {pushMsg ? <p className="settings-msg">{pushMsg}</p> : null}
        <div className="settings-divider" />
        <button
          type="button"
          className="settings-row-link"
          onClick={() => {
            requestTourReplay()
            router.push('/')
            window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))
          }}
        >
          <span>Replay app tour</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </button>
      </div>
    </SettingsDetailShell>
  )
}
