import { Suspense } from 'react'
import SettingsInvoicingPage from '@/components/settings/SettingsInvoicingPage'

export default function InvoicingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="screen page-content settings-screen settings-screen--loading">Loading…</div>
      }
    >
      <SettingsInvoicingPage />
    </Suspense>
  )
}
