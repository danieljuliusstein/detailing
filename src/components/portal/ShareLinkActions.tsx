'use client'

import { useState } from 'react'
import { Copy, EnvelopeSimple, Link } from '@phosphor-icons/react'
import { copyShareLink, createShareLink, emailShareLink, type PortalScope } from '@/lib/portal-client'
import { loadSettings } from '@/lib/settings'

export default function ShareLinkActions({
  clientId,
  clientEmail,
  clientName,
  jobId,
  quoteId,
  scope,
  emailSubject,
  emailMessage,
}: {
  clientId: string
  clientEmail?: string
  clientName: string
  jobId?: string
  quoteId?: string
  scope: PortalScope
  emailSubject?: string
  emailMessage?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const ensureLink = async () => {
    if (url) return url
    const result = await createShareLink({ clientId, scope, jobId, quoteId })
    setUrl(result.url)
    return result.url
  }

  const handleCopy = async () => {
    setBusy(true)
    setMsg('')
    try {
      const link = await ensureLink()
      await copyShareLink(link)
      setMsg('Link copied')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = async () => {
    if (!clientEmail) {
      setMsg('Client has no email')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const link = await ensureLink()
      const settings = loadSettings()
      await emailShareLink({
        to: clientEmail,
        clientName,
        businessName: settings.business_name,
        portalUrl: link,
        subject: emailSubject,
        message: emailMessage,
      })
      setMsg('Email sent')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleOpen = async () => {
    setBusy(true)
    try {
      const link = await ensureLink()
      window.open(link, '_blank')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn-ghost" disabled={busy} onClick={handleCopy} style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Copy size={16} /> Copy
        </button>
        <button type="button" className="btn-ghost" disabled={busy || !clientEmail} onClick={handleEmail} style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <EnvelopeSimple size={16} /> Email
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={handleOpen} style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Link size={16} /> Preview
        </button>
      </div>
      {msg && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>{msg}</div>}
      {url && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, wordBreak: 'break-all' }}>{url}</div>
      )}
    </div>
  )
}
