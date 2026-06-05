import { getPocketBase } from '../pocketbase'
import { buildInvoiceFromJob, normalizeInvoice } from '../invoices'
import { pbInvoiceToApp, escapeFilterValue, type PbRecord } from './mappers'
import type { Invoice, Payment } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getInvoices(): Promise<Invoice[]> {
  const records = await pb().collection('invoices').getFullList<PbRecord>({ sort: '-created' })
  return records.map((r) => normalizeInvoice(pbInvoiceToApp(r)))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const record = await pb().collection('invoices').getOne<PbRecord>(id)
    return normalizeInvoice(pbInvoiceToApp(record))
  } catch {
    return null
  }
}

export async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  const escaped = escapeFilterValue(jobId)
  const records = await pb().collection('invoices').getFullList<PbRecord>({
    filter: `job_id = "${escaped}"`,
    limit: 1,
  })
  if (records.length === 0) return null
  return normalizeInvoice(pbInvoiceToApp(records[0]))
}

export async function createInvoiceForJob(jobId: string): Promise<Invoice> {
  const existing = await getInvoiceByJobId(jobId)
  if (existing) return existing

  const job = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const draft = buildInvoiceFromJob({
    jobId,
    clientId: String(job.client_id),
    revenue: Number(job.revenue ?? 0),
    tip: Number(job.tip ?? 0),
    invoiceNumber: 'PENDING',
  })

  const created = await pb().collection('invoices').create<PbRecord>({
    invoice_number: 'PENDING',
    job_id: jobId,
    client_id: draft.client_id,
    subtotal: draft.subtotal,
    tip: draft.tip,
    total: draft.total,
    status: draft.status,
    payments: draft.payments,
    amount_paid: draft.amount_paid,
    balance_due: draft.balance_due,
    terms: draft.terms,
  })

  await pb().collection('jobs').update(jobId, {
    invoice_id: created.id,
    status: 'invoiced',
  })

  return normalizeInvoice(pbInvoiceToApp(created))
}

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  const updated = await pb().collection('invoices').update<PbRecord>(invoiceId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
  return normalizeInvoice(pbInvoiceToApp(updated))
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<Invoice> {
  const current = await getInvoice(invoiceId)
  if (!current) throw new Error('Invoice not found')

  const payments = [...current.payments, payment]
  const normalized = normalizeInvoice({ ...current, payments })

  const updated = await pb().collection('invoices').update<PbRecord>(invoiceId, {
    payments,
    amount_paid: normalized.amount_paid,
    balance_due: normalized.balance_due,
    status: normalized.status,
    paid_at: normalized.paid_at ?? '',
  })

  if (normalized.status === 'paid') {
    await pb().collection('jobs').update(normalized.job_id, { status: 'paid' })
  }

  return normalizeInvoice(pbInvoiceToApp(updated))
}

export async function markInvoicePaid(invoiceId: string, method: string): Promise<Invoice> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  if (invoice.balance_due <= 0) return invoice

  return addPayment(invoiceId, {
    amount: invoice.balance_due,
    method,
    date: new Date().toISOString().split('T')[0],
  })
}
