'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Envelope, FilePdf, PaperPlaneTilt, Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import {
  addPayment,
  createInvoiceForJob,
  getJob,
  markInvoicePaid,
  markInvoiceSent,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import { PAYMENT_METHODS } from '@/lib/invoices'
import { downloadInvoicePdf } from '@/lib/pdf/downloadInvoicePdf'
import { createShareLink } from '@/lib/portal-client'
import { loadSettings } from '@/lib/settings'
import type { JobWithRelations } from '@/lib/types'

const invoiceStatusBadge: Record<string, string> = {
  draft: 'badge-draft',
  sent: 'badge-pending',
  partial: 'badge-pending',
  paid: 'badge-paid',
  overdue: 'badge-overdue',
}

export default function InvoicePreview({ job: initialJob }: { job: JobWithRelations }) {
  const router = useRouter()
  const settings = loadSettings()
  const [job, setJob] = useState(initialJob)
  const [busy, setBusy] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS[0])
  const [message, setMessage] = useState('')

  const invoice = job.invoice
  const today = new Date().toISOString().split('T')[0]

  const refresh = useCallback(async () => {
    const updated = await getJob(job.id)
    if (updated) setJob(updated)
  }, [job.id])

  const handleGenerate = async () => {
    setBusy(true)
    setMessage('')
    try {
      await createInvoiceForJob(job.id)
      await refresh()
      setMessage('Invoice created')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to create invoice')
    } finally {
      setBusy(false)
    }
  }

  const handleSend = async () => {
    if (!invoice) return
    setBusy(true)
    setMessage('')
    try {
      let inv = invoice
      if (inv.status === 'draft') {
        inv = await markInvoiceSent(inv.id)
      }
      if (settings.business_email && job.client?.email) {
        let portalUrl: string | undefined
        try {
          const link = await createShareLink({
            clientId: job.client_id,
            jobId: job.id,
            scope: 'invoice',
          })
          portalUrl = link.url
        } catch {
          // email still sends without portal link
        }
        const res = await fetch('/api/invoices/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: job.client.email,
            clientName: job.client.name,
            invoiceNumber: inv.invoice_number,
            total: inv.total,
            businessName: settings.business_name,
            fromEmail: settings.business_email,
            portalUrl,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Email failed')
        setMessage('Invoice sent via email')
      } else {
        setMessage('Invoice marked as sent')
      }
      await refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setBusy(false)
    }
  }

  const handlePdf = async () => {
    if (!invoice) return
    setBusy(true)
    setMessage('')
    try {
      await downloadInvoicePdf(job, invoice, settings)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setBusy(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setBusy(true)
    try {
      await markInvoicePaid(invoice.id, 'Cash')
      await refresh()
      setMessage('Marked as paid')
    } finally {
      setBusy(false)
    }
  }

  const handleAddPayment = async () => {
    if (!invoice || payAmount <= 0) return
    setBusy(true)
    try {
      await addPayment(invoice.id, { amount: payAmount, method: payMethod, date: today })
      await refresh()
      setShowPayment(false)
      setPayAmount(0)
      setMessage('Payment logged')
    } finally {
      setBusy(false)
    }
  }

  if (!invoice) {
    return (
      <div className="screen page-content">
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
          <BackButton onClick={() => router.back()} />
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Invoice</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 20 }}>
          <FilePdf size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>No invoice for this job yet</div>
          <button className="btn-primary" onClick={handleGenerate} disabled={busy}>
            {busy ? 'Creating…' : 'Generate invoice'}
          </button>
        </div>
        {message && <div style={{ fontSize: 13, color: 'var(--green)', textAlign: 'center' }}>{message}</div>}
      </div>
    )
  }

  const status = invoice.status

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Invoice</div>
        <span className={`badge ${invoiceStatusBadge[status] ?? 'badge-draft'}`}>{status}</span>
      </div>

      <div className="card" style={{ background: 'var(--bg-surface-hover)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-strong)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0,
          }}>Logo</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{settings.business_name}</div>
            {settings.business_phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{settings.business_phone}</div>}
            {settings.business_email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{settings.business_email}</div>}
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>INVOICE</div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 16 }}>{invoice.invoice_number}</div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Bill to</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>{job.client?.name}</div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}{job.vehicle_type} · {job.package?.name}
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>{job.package?.name}</span>
          <span className="money" style={{ fontSize: 13 }}>{fmtDetailed(job.revenue)}</span>
        </div>
        {job.tip > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tip</span>
            <span className="money" style={{ fontSize: 13 }}>{fmtDetailed(job.tip)}</span>
          </div>
        )}

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
          <span className="money money-positive" style={{ fontSize: 18, fontWeight: 700 }}>{fmtDetailed(invoice.total)}</span>
        </div>

        {invoice.payments.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Payments</div>
            {invoice.payments.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.method} · {p.date}</span>
                <span className="money money-positive" style={{ fontSize: 13 }}>{fmtDetailed(p.amount)}</span>
              </div>
            ))}
          </>
        )}

        {invoice.balance_due > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>Balance due</span>
            <span className="money" style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>{fmtDetailed(invoice.balance_due)}</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16, lineHeight: 1.5 }}>
          {settings.invoice_terms_footer}
        </div>
      </div>

      {showPayment && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Log payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input type="number" className="input" placeholder="Amount" value={payAmount || ''} onChange={(e) => setPayAmount(Number(e.target.value))} />
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn-primary" onClick={handleAddPayment} disabled={busy}>Save</button>
            <button className="btn-ghost" onClick={() => setShowPayment(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button className="btn-ghost" onClick={handlePdf} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FilePdf size={18} /> PDF
        </button>
        <button className="btn-ghost" onClick={handleSend} disabled={busy || status === 'paid'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Envelope size={18} /> {status === 'draft' ? 'Send' : 'Resend'}
        </button>
      </div>

      {invoice.balance_due > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <button className="btn-ghost" onClick={() => { setPayAmount(invoice.balance_due); setShowPayment(true) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16} /> Partial pay
          </button>
          <button className="btn-primary" onClick={handleMarkPaid} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PaperPlaneTilt size={16} /> Mark paid
          </button>
        </div>
      )}

      {message && <div style={{ fontSize: 13, color: 'var(--green)', textAlign: 'center', marginTop: 8 }}>{message}</div>}
    </div>
  )
}
