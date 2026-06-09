import { fmtLineItem } from './calculations'
import type { AppSettings } from './settings'
import type { Invoice, InvoiceStatus, JobWithRelations } from './types'

export const INVOICE_ACCENT = '#22c55e'

export interface InvoiceLineItem {
  description: string
  note?: string
  amount: number
}

export interface InvoicePaymentRow {
  method: string
  date: string
  amount: number
}

export interface InvoiceViewModel {
  businessName: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  logoUrl?: string
  invoiceNumber: string
  issuedDateLabel: string
  statusLabel: string
  statusTone: InvoiceStatus
  billToName: string
  billToPhone?: string
  billToEmail?: string
  billToAddress?: string
  serviceDateLabel: string
  vehicleLabel: string
  locationLabel: string
  serviceContextLine: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  tip: number
  total: number
  balanceDue: number
  showTip: boolean
  payments: InvoicePaymentRow[]
  showPayments: boolean
  termsFooter: string
  questionsLine?: string
  portalUrl?: string
  isPaid: boolean
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function locationDetailLabel(locationType: string): string {
  return locationType === 'mobile' ? 'Mobile detail' : 'Shop detail'
}

function statusDisplay(status: InvoiceStatus): { label: string; tone: InvoiceStatus } {
  switch (status) {
    case 'paid':
      return { label: 'PAID', tone: 'paid' }
    case 'overdue':
      return { label: 'OVERDUE', tone: 'overdue' }
    case 'sent':
      return { label: 'SENT', tone: 'sent' }
    case 'partial':
      return { label: 'PARTIAL', tone: 'partial' }
    default:
      return { label: 'DRAFT', tone: 'draft' }
  }
}

/** Shared currency formatting for invoice line items and totals. */
export function formatInvoiceMoney(amount: number): string {
  return fmtLineItem(amount)
}

export function buildInvoiceViewModel(
  job: JobWithRelations,
  invoice: Invoice,
  settings: AppSettings,
  options?: { portalUrl?: string }
): InvoiceViewModel {
  const client = job.client
  const packageName = job.package?.name?.trim() || 'Detailing service'
  const vehicleLabel = capitalize(job.vehicle_type)
  const locationLabel = locationDetailLabel(job.location_type)
  const serviceDateLabel = formatLongDate(job.date)
  const issuedSource = invoice.sent_at?.trim() || job.date
  const { label: statusLabel, tone: statusTone } = statusDisplay(invoice.status)

  const lineItems: InvoiceLineItem[] = [
    {
      description: packageName,
      note: job.notes?.trim() || undefined,
      amount: job.revenue,
    },
  ]

  const questionsParts: string[] = []
  if (settings.business_email) questionsParts.push(settings.business_email)
  if (settings.business_phone) questionsParts.push(settings.business_phone)

  return {
    businessName: settings.business_name,
    businessPhone: settings.business_phone?.trim() || undefined,
    businessEmail: settings.business_email?.trim() || undefined,
    businessAddress: settings.business_address?.trim() || undefined,
    logoUrl: settings.logo_url?.trim() || undefined,
    invoiceNumber: invoice.invoice_number,
    issuedDateLabel: formatLongDate(issuedSource.split('T')[0]),
    statusLabel,
    statusTone,
    billToName: client?.name?.trim() || 'Client',
    billToPhone: client?.phone?.trim() || undefined,
    billToEmail: client?.email?.trim() || undefined,
    billToAddress: client?.address?.trim() || undefined,
    serviceDateLabel,
    vehicleLabel,
    locationLabel,
    serviceContextLine: `${vehicleLabel} · ${locationLabel} · ${serviceDateLabel}`,
    lineItems,
    subtotal: job.revenue,
    tip: job.tip,
    total: invoice.total,
    balanceDue: invoice.balance_due,
    showTip: job.tip > 0,
    payments: invoice.payments.map((p) => ({
      method: p.method,
      date: p.date,
      amount: p.amount,
    })),
    showPayments: invoice.payments.length > 0,
    termsFooter: settings.invoice_terms_footer?.trim() || '',
    questionsLine:
      questionsParts.length > 0 ? `Questions? ${questionsParts.join(' · ')}` : undefined,
    portalUrl: options?.portalUrl,
    isPaid: invoice.status === 'paid' || invoice.balance_due <= 0,
  }
}
