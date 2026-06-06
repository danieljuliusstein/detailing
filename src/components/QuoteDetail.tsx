'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FilePdf, PaperPlaneTilt, X } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import ShareLinkActions from '@/components/portal/ShareLinkActions'
import {
  acceptQuote,
  declineQuote,
  getQuote,
  markQuoteSent,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import { downloadQuotePdf } from '@/lib/pdf/downloadQuotePdf'
import { loadSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'

const statusBadge: Record<string, string> = {
  draft: 'badge-draft',
  sent: 'badge-pending',
  accepted: 'badge-paid',
  declined: 'badge-overdue',
  expired: 'badge-overdue',
}

export default function QuoteDetail({ quote: initial }: { quote: QuoteWithRelations }) {
  const router = useRouter()
  const settings = loadSettings()
  const [quote, setQuote] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const updated = await getQuote(quote.id)
    if (updated) setQuote(updated)
  }, [quote.id])

  const handleSend = async () => {
    setBusy(true)
    setMessage('')
    try {
      await markQuoteSent(quote.id)
      await refresh()
      setMessage('Marked as sent — share link below to email client')
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    setBusy(true)
    setMessage('')
    try {
      const result = await acceptQuote(quote.id)
      if (result) {
        setMessage('Quote accepted — job scheduled')
        router.push(`/jobs/${result.jobId}`)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Accept failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDecline = async () => {
    setBusy(true)
    try {
      await declineQuote(quote.id)
      await refresh()
      setMessage('Quote declined')
    } finally {
      setBusy(false)
    }
  }

  const handlePdf = async () => {
    setBusy(true)
    try {
      await downloadQuotePdf(quote, settings)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'PDF failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 20 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{quote.quote_number}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quote.client?.name}</div>
        </div>
        <span className={`badge ${statusBadge[quote.status]}`}>{quote.status}</span>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, marginBottom: 8 }}>{quote.package?.name} · {quote.vehicle_type}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          Proposed: {new Date(quote.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        {quote.valid_until && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Valid until {new Date(quote.valid_until + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmtDetailed(quote.subtotal)}</div>
        {quote.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>{quote.notes}</div>}
      </div>

      {quote.client && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title">Client portal link</div>
          <ShareLinkActions
            clientId={quote.client_id}
            clientEmail={quote.client.email}
            clientName={quote.client.name}
            quoteId={quote.id}
            scope="quote"
            emailSubject={`Estimate ${quote.quote_number} from ${settings.business_name}`}
            emailMessage="Review and accept your estimate using the secure link below."
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button type="button" className="btn-ghost" disabled={busy} onClick={handlePdf} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FilePdf size={18} /> PDF
        </button>
        <button type="button" className="btn-ghost" disabled={busy || quote.status !== 'draft'} onClick={handleSend} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <PaperPlaneTilt size={18} /> Mark sent
        </button>
      </div>

      {(quote.status === 'sent' || quote.status === 'draft') && !quote.job_id && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button type="button" className="btn-primary" disabled={busy} onClick={handleAccept} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Check size={18} /> Accept → job
          </button>
          <button type="button" className="btn-ghost" disabled={busy} onClick={handleDecline} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <X size={18} /> Decline
          </button>
        </div>
      )}

      {quote.job_id && (
        <button type="button" className="btn-ghost" style={{ width: '100%', marginBottom: 12 }} onClick={() => router.push(`/jobs/${quote.job_id}`)}>
          View scheduled job
        </button>
      )}

      {message && <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{message}</div>}
    </div>
  )
}
