'use client'

import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsInvoicingPage() {
  const { settings, ready, update } = useSettingsDraft()

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="Invoicing">
      <div className="settings-panel">
        <div className="settings-field">
          <label htmlFor="settings-invoice-terms">Terms footer</label>
          <p className="settings-field-hint">Shown on invoice PDFs and the client portal footer.</p>
          <textarea
            id="settings-invoice-terms"
            className="input settings-textarea"
            rows={5}
            value={settings.invoice_terms_footer}
            onChange={(e) => update('invoice_terms_footer', e.target.value)}
          />
        </div>
      </div>
    </SettingsDetailShell>
  )
}
