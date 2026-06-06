'use client'

import { useState } from 'react'
import type { PortalPayload } from '@/lib/server/portal-data'
import { fmtDetailed } from '@/lib/calculations'

export default function PortalView({
  payload,
  token,
}: {
  payload: PortalPayload
  token: string
}) {
  const [acceptMsg, setAcceptMsg] = useState('')
  const [accepting, setAccepting] = useState(false)

  const before = payload.photos.filter((p) => p.type === 'before')
  const after = payload.photos.filter((p) => p.type === 'after')
  const showInvoice = payload.scope === 'invoice' || payload.scope === 'full'
  const showPhotos = payload.scope === 'photos' || payload.scope === 'full' || payload.scope === 'job'
  const showQuote = payload.scope === 'quote' && payload.quote

  const handleAcceptQuote = async () => {
    setAccepting(true)
    setAcceptMsg('')
    try {
      const res = await fetch(`/api/portal/${token}/accept-quote`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAcceptMsg(data.alreadyAccepted ? 'Already accepted — we will be in touch!' : 'Quote accepted — thank you!')
    } catch (e) {
      setAcceptMsg(e instanceof Error ? e.message : 'Could not accept')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="screen page-content" style={{ maxWidth: 480, margin: '0 auto', paddingTop: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {payload.business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payload.business.logoUrl}
            alt=""
            style={{ maxHeight: 56, marginBottom: 12, borderRadius: 4 }}
          />
        )}
        <div style={{ fontSize: 20, fontWeight: 700 }}>{payload.business.name}</div>
        {payload.business.phone && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{payload.business.phone}</div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Prepared for</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{payload.client.name}</div>
      </div>

      {showQuote && payload.quote && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Estimate {payload.quote.quoteNumber}</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            {payload.quote.packageName} · {payload.quote.vehicleType}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Proposed date:{' '}
            {new Date(payload.quote.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {payload.quote.validUntil && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Valid until{' '}
              {new Date(payload.quote.validUntil + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>
            {fmtDetailed(payload.quote.subtotal)}
          </div>
          {payload.quote.notes && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
              {payload.quote.notes}
            </div>
          )}
          {payload.quote.status === 'sent' && (
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              disabled={accepting}
              onClick={handleAcceptQuote}
            >
              {accepting ? 'Submitting…' : 'Accept estimate'}
            </button>
          )}
          {acceptMsg && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
              {acceptMsg}
            </div>
          )}
          {payload.business.termsFooter && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16, lineHeight: 1.5 }}>
              {payload.business.termsFooter}
            </div>
          )}
        </div>
      )}

      {payload.job && !showQuote && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Service</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            {payload.job.packageName} · {payload.job.vehicleType}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {new Date(payload.job.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      )}

      {showInvoice && payload.invoice && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Invoice {payload.invoice.invoiceNumber}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total</span>
            <span className="money" style={{ fontWeight: 600 }}>{fmtDetailed(payload.invoice.total)}</span>
          </div>
          {payload.invoice.amountPaid > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Paid</span>
              <span className="money money-positive">{fmtDetailed(payload.invoice.amountPaid)}</span>
            </div>
          )}
          {payload.invoice.balanceDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 600 }}>Balance due</span>
              <span className="money" style={{ fontWeight: 700, color: 'var(--amber)' }}>
                {fmtDetailed(payload.invoice.balanceDue)}
              </span>
            </div>
          )}
        </div>
      )}

      {showPhotos && payload.photos.length > 0 && (
        <>
          {before.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Before</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {before.map((p) => (
                  <div key={p.filename} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {after.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">After</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {after.map((p) => (
                  <div key={p.filename} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="card" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {payload.business.email && <div>{payload.business.email}</div>}
        {payload.business.address && <div>{payload.business.address}</div>}
      </div>
    </div>
  )
}
