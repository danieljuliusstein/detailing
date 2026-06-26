'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOut, Copy } from '@phosphor-icons/react'
import { saveSettingsAsync } from '@/lib/settings'
import { loadOrganizationSlug } from '@/lib/tenant'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsBusinessPage() {
  const { settings, ready, update, logoFile, setLogoFile, reload } = useSettingsDraft()
  const [orgSlug, setOrgSlug] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)

  useEffect(() => {
    void loadOrganizationSlug().then((slug) => setOrgSlug(slug ?? ''))
  }, [])

  const bookingUrl =
    typeof window !== 'undefined' && orgSlug ? `${window.location.origin}/book/${orgSlug}` : ''

  const copyBookingLink = async () => {
    if (!bookingUrl) return
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setLinkCopied(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!settings?.logo_url || settings.logo_url === '/logo.png') return
    if (!confirm('Remove your custom logo? The default mark will be used until you upload a new one.')) return
    setRemovingLogo(true)
    try {
      await saveSettingsAsync({ ...settings, logo_url: '/logo.png' }, null, { clearLogo: true })
      await reload()
    } finally {
      setRemovingLogo(false)
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
    <SettingsDetailShell title="Your business">
      <div className="settings-panel">
        <p className="settings-panel__lead">
          Logo and business name appear on invoices, your booking page, and the client portal.
        </p>

        <div className="settings-field">
          <span className="settings-field__label" id="settings-logo-label">
            Logo
          </span>
          {settings.logo_url && settings.logo_url !== '/logo.png' ? (
            <img src={settings.logo_url} alt="Business logo" className="settings-logo-preview" />
          ) : null}
          <div className="settings-logo-actions">
            <label htmlFor="settings-logo" className="btn-ghost settings-logo-upload-btn">
              {settings.logo_url && settings.logo_url !== '/logo.png' ? 'Change logo' : 'Upload logo'}
            </label>
            <input
              id="settings-logo"
              type="file"
              accept="image/*"
              className="settings-file-input"
              aria-labelledby="settings-logo-label"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            {logoFile ? <span className="settings-logo-pending">{logoFile.name}</span> : null}
            {settings.logo_url && settings.logo_url !== '/logo.png' ? (
              <button
                type="button"
                className="btn-ghost settings-remove-logo"
                onClick={() => void handleRemoveLogo()}
                disabled={removingLogo}
              >
                {removingLogo ? 'Removing…' : 'Remove logo'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="settings-business_name">Business name</label>
          <input
            id="settings-business_name"
            className="input"
            value={settings.business_name}
            onChange={(e) => update('business_name', e.target.value)}
            placeholder="Your detailing business"
            autoComplete="organization"
          />
        </div>

        <div className="settings-divider" />

        {(
          [
            ['business_phone', 'Phone'],
            ['business_email', 'Email'],
            ['business_address', 'Address'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="settings-field">
            <label htmlFor={`settings-${key}`}>{label}</label>
            <input
              id={`settings-${key}`}
              className="input"
              value={settings[key]}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}

        <div className="settings-divider" />

        <p className="settings-field__label">Online booking</p>
        <div className="booking-link-block">
          {bookingUrl ? (
            <>
              <div className="booking-link-url">{bookingUrl}</div>
              <div className="booking-link-actions">
                <button type="button" className="btn-ghost booking-link-btn" onClick={() => void copyBookingLink()}>
                  <Copy size={16} weight="bold" aria-hidden="true" />
                  {linkCopied ? 'Copied!' : 'Copy booking link'}
                </button>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary booking-link-btn"
                >
                  <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
                  Preview booking page
                </a>
              </div>
            </>
          ) : (
            <p className="settings-status-line">Your booking link will appear after you sign in.</p>
          )}
        </div>
      </div>
    </SettingsDetailShell>
  )
}
