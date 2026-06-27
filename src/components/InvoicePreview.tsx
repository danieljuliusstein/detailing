'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { PAYMENT_METHODS } from '@/lib/invoices'
import { downloadInvoicePdf } from '@/lib/pdf/downloadInvoicePdf'
import { createShareLink } from '@/lib/portal-client'
import { getAuthFetchHeaders } from '@/lib/pb-auth'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import InvoiceDocumentBody from '@/components/invoice/InvoiceDocumentBody'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { loadSettings, loadSettingsAsync, type AppSettings } from '@/lib/settings'
import type { JobWithRelations } from '@/lib/types'

export default function InvoicePreview({ job: initialJob }: { job: JobWithRelations }) {
  const router = useRouter()
  const paymentFormRef = useRef<HTMLDivElement>(null)
  const payMethodRef = useRef<HTMLSelectElement>(null)
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [job, setJob] = useState(initialJob)
  const [busy, setBusy] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS[0])
  const [message, setMessage] = useState('')
  const [sendDone, setSendDone] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | undefined>()

  const invoice = job.invoice
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadSettingsAsync().then(setSettings)
  }, [])

  useEffect(() => {
    if (!showPayment) return
    syncPrefilledFloatingLabels(paymentFormRef.current)
    syncSelectFloatingLabel(payMethodRef.current)
  }, [showPayment, payAmount, payMethod])

  useEffect(() => {
    if (!invoice?.id || !job.client_id) return
    createShareLink({ clientId: job.client_id, jobId: job.id, scope: 'invoice' })
      .then((link) => setPortalUrl(link.url))
      .catch(() => setPortalUrl(undefined))
  }, [invoice?.id, job.client_id, job.id])

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
          headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
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
      setSendDone(true)
      window.setTimeout(() => setSendDone(false), 2000)
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
      await downloadInvoicePdf(job, invoice, settings, portalUrl)
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
    <div className="screen page-content invoice-screen">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 16, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Invoice</div>
      </div>

      <div className="card invoice-doc-card invoice-doc-card-wrap">
        <InvoiceDocumentBody job={job} invoice={invoice} settings={settings} portalUrl={portalUrl} />
      </div>

      {showPayment && (
        <div ref={paymentFormRef} className="page-form-card page-form" style={{ marginBottom: 16 }}>
          <div className="section-title">Log payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FloatingAffixField
              id="pay-amount"
              label="Amount"
              filled={payAmount > 0}
              type="number"
              value={payAmount || ''}
              onChange={(e) => setPayAmount(Number(e.target.value))}
            />
            <FloatingField id="pay-method" label="Method" filled={Boolean(payMethod)}>
              <select
                ref={payMethodRef}
                id="pay-method"
                className={`f-select${payMethod ? ' hv' : ''}`}
                value={payMethod}
                onChange={(e) => {
                  setPayMethod(e.target.value)
                  syncSelectFloatingLabel(payMethodRef.current)
                }}
              >
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </FloatingField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="page-form-save" style={{ margin: 0 }}>
              <SheetSubmitButton
                label="Save"
                ready={payAmount > 0}
                disabled={busy}
                onClick={() => void handleAddPayment()}
              />
            </div>
            <button className="btn-ghost" onClick={() => setShowPayment(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="invoice-screen__actions">
        <button className="btn-ghost" onClick={handlePdf} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FilePdf size={18} /> PDF
        </button>
        <button className="btn-ghost" onClick={handleSend} disabled={busy || sendDone || status === 'paid'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Envelope size={18} /> {busy ? 'Sending…' : sendDone ? 'Sent' : status === 'draft' ? 'Send' : 'Resend'}
        </button>
      </div>

      {invoice.balance_due > 0 && (
        <div className="invoice-screen__actions">
          <button className="btn-ghost" onClick={() => { setPayAmount(invoice.balance_due); setShowPayment(true) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16} /> Partial pay
          </button>
          <button className="btn-primary" onClick={handleMarkPaid} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PaperPlaneTilt size={16} /> Mark paid
          </button>
        </div>
      )}

      {message && <div className="invoice-screen__message">{message}</div>}
    </div>
  )
}
