'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import { readApiJson } from '@/lib/api-json'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

type ConnectStatus = {
  accountId: string | null
  chargesEnabled: boolean
  detailsSubmitted: boolean
  ready: boolean
}

async function connectFetch(path: string, method: 'GET' | 'POST' = 'GET') {
  const token = getPocketBaseAuthToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await readApiJson(res)
  if (!res.ok) throw new Error(String(data.error ?? 'Request failed'))
  return data
}

export default function SettingsInvoicingPage() {
  const searchParams = useSearchParams()
  const { settings, ready, update } = useSettingsDraft()
  const [connect, setConnect] = useState<ConnectStatus | null>(null)
  const [connectLoading, setConnectLoading] = useState(true)
  const [connectBusy, setConnectBusy] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const connectReturn = searchParams.get('connect')

  const loadConnect = useCallback(async () => {
    setConnectLoading(true)
    setConnectError(null)
    try {
      const data = await connectFetch('/api/stripe/connect/status')
      setConnect(data as ConnectStatus)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Could not load Stripe status')
    } finally {
      setConnectLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void loadConnect()
  }, [ready, loadConnect, connectReturn])

  const handleConnect = async () => {
    setConnectBusy(true)
    setConnectError(null)
    try {
      const data = await connectFetch('/api/stripe/connect/onboard', 'POST')
      const url = typeof data.url === 'string' ? data.url : null
      if (url) window.location.href = url
      else throw new Error('Could not open Stripe')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Could not open Stripe')
    } finally {
      setConnectBusy(false)
    }
  }

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  const connectReady = connect?.ready === true

  return (
    <SettingsDetailShell title="Invoicing">
      <section className="card settings-billing-card">
        <div className="settings-billing-card__row">
          <h2 className="settings-billing-card__title">Accept payments online</h2>
          {connectLoading ? null : (
            <Badge tone={connectReady ? 'green' : 'amber'}>
              {connectReady ? 'Connected' : 'Setup needed'}
            </Badge>
          )}
        </div>
        <p className="settings-panel__lead settings-panel__lead--tight">
          Connect your Stripe account so clients pay you directly when they click Pay online on
          invoices. Rinse subscription billing is separate.
        </p>
        {connectReturn === 'return' ? (
          <p className="settings-msg">Stripe setup updated — checking status…</p>
        ) : null}
        {connectReturn === 'refresh' ? (
          <p className="settings-msg settings-msg--warn">Stripe session expired — try again.</p>
        ) : null}
        {!connectLoading && connect && !connectReady ? (
          <p className="settings-status-line">
            {connect.accountId
              ? 'Finish Stripe onboarding to enable Pay online on client invoices.'
              : 'Connect Stripe to turn on Pay online for your portal invoices.'}
          </p>
        ) : null}
        {!connectLoading && !connectReady ? (
          <p className="settings-field-hint" style={{ marginTop: 8 }}>
            Stripe opens in your browser. If captcha fails, use Safari or Chrome (not an embedded preview). Use a real business email in Settings → Your business.
          </p>
        ) : null}
        {!connectLoading && connectReady ? (
          <p className="settings-status-line">Client invoice payments deposit to your Stripe account.</p>
        ) : null}
        <div className="settings-divider" />
        <Button
          type="button"
          variant={connectReady ? 'secondary' : 'primary'}
          disabled={connectBusy || connectLoading}
          onClick={() => void handleConnect()}
        >
          {connectReady ? 'Manage Stripe account' : 'Connect Stripe'}
        </Button>
        {connectError ? <p className="settings-msg settings-msg--error">{connectError}</p> : null}
      </section>

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
