import { Suspense } from 'react'
import SettingsBillingPage from '@/components/settings/SettingsBillingPage'

export default function BillingSettingsRoute() {
  return (
    <Suspense fallback={<div className="screen page-content settings-screen settings-screen--loading">Loading…</div>}>
      <SettingsBillingPage />
    </Suspense>
  )
}
