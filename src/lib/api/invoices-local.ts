import {
  buildInvoiceFromJob,
  generateInvoiceNumber,
  normalizeInvoice,
} from '../invoices'
import { loadData, newId, saveData } from '../storage'
import type { Invoice, Job, Payment } from '../types'

function persistInvoice(invoice: Invoice): Invoice {
  const data = loadData()
  const idx = data.invoices.findIndex((i) => i.id === invoice.id)
  const normalized = normalizeInvoice(invoice)
  if (idx >= 0) data.invoices[idx] = normalized
  else data.invoices.push(normalized)
  saveData(data)
  return normalized
}

function linkJobToInvoice(jobId: string, invoiceId: string, jobStatus: Job['status']) {
  const data = loadData()
  const job = data.jobs.find((j) => j.id === jobId)
  if (job) {
    job.invoice_id = invoiceId
    job.status = jobStatus
    job.updated = new Date().toISOString()
    saveData(data)
  }
}

export function getInvoices(): Invoice[] {
  return loadData().invoices.map((i) => normalizeInvoice(i))
}

export function getInvoice(id: string): Invoice | null {
  const inv = loadData().invoices.find((i) => i.id === id)
  return inv ? normalizeInvoice(inv) : null
}

export function getInvoiceByJobId(jobId: string): Invoice | null {
  const data = loadData()
  const job = data.jobs.find((j) => j.id === jobId)
  if (!job?.invoice_id) return null
  return getInvoice(job.invoice_id)
}

export function createInvoiceForJob(jobId: string): Invoice {
  const data = loadData()
  const job = data.jobs.find((j) => j.id === jobId)
  if (!job) throw new Error('Job not found')
  if (job.invoice_id) {
    const existing = getInvoice(job.invoice_id)
    if (existing) return existing
  }

  const invoiceNumber = generateInvoiceNumber(data.invoices, new Date(job.date + 'T12:00:00'))
  const draft = buildInvoiceFromJob({
    jobId: job.id,
    clientId: job.client_id,
    revenue: job.revenue,
    tip: job.tip,
    invoiceNumber,
  })

  const invoice: Invoice = { ...draft, id: newId() }
  const saved = persistInvoice(invoice)
  linkJobToInvoice(job.id, saved.id, 'invoiced')
  return saved
}

export function markInvoiceSent(invoiceId: string): Invoice {
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  return persistInvoice({
    ...invoice,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
}

export function addPayment(invoiceId: string, payment: Payment): Invoice {
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  const payments = [...invoice.payments, payment]
  const updated = normalizeInvoice({ ...invoice, payments })
  const saved = persistInvoice(updated)

  const data = loadData()
  const job = data.jobs.find((j) => j.id === saved.job_id)
  if (job) {
    job.status = saved.status === 'paid' ? 'paid' : job.status === 'scheduled' ? 'invoiced' : job.status
    if (saved.status === 'paid') job.status = 'paid'
    else if (saved.amount_paid > 0) job.status = 'invoiced'
    saveData(data)
  }

  return saved
}

export function markInvoicePaid(invoiceId: string, method: string): Invoice {
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  if (invoice.balance_due <= 0) return invoice

  const payment: Payment = {
    amount: invoice.balance_due,
    method,
    date: new Date().toISOString().split('T')[0],
  }

  return addPayment(invoiceId, payment)
}
