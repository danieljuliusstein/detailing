'use client'

import BusinessLogo from '@/components/BusinessLogo'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  buildInvoiceViewModel,
  formatInvoiceMoney,
  type InvoiceViewModel,
} from '@/lib/invoice-layout'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

interface InvoiceDocumentBodyProps {
  job: JobWithRelations
  invoice: Invoice
  settings: AppSettings
  portalUrl?: string
}

function statusClass(tone: InvoiceViewModel['statusTone']): string {
  return `invoice-doc-status invoice-doc-status--${tone}`
}

export default function InvoiceDocumentBody({
  job,
  invoice,
  settings,
  portalUrl,
}: InvoiceDocumentBodyProps) {
  const vm = buildInvoiceViewModel(job, invoice, settings, { portalUrl })

  return (
    <div className="invoice-doc">
      <div className="invoice-doc-header">
        <div className="invoice-doc-header-left">
          <BusinessLogo logoUrl={vm.logoUrl} size={64} />
          <div className="invoice-doc-business">
            <div className="invoice-doc-business-name">{vm.businessName}</div>
            {vm.businessPhone && <div className="invoice-doc-muted">{vm.businessPhone}</div>}
            {vm.businessEmail && <div className="invoice-doc-muted">{vm.businessEmail}</div>}
            {vm.businessAddress && <div className="invoice-doc-muted">{vm.businessAddress}</div>}
          </div>
        </div>
        <div className="invoice-doc-header-right">
          <div className="invoice-doc-invoice-label">INVOICE</div>
          <div className="invoice-doc-invoice-number">{vm.invoiceNumber}</div>
          <div className="invoice-doc-muted">Issued {vm.issuedDateLabel}</div>
          <span className={statusClass(vm.statusTone)}>{vm.statusLabel}</span>
        </div>
      </div>

      <div className="invoice-doc-two-col">
        <div>
          <div className="invoice-doc-label">Bill to</div>
          <div className="invoice-doc-client-name">{vm.billToName}</div>
          {vm.billToPhone && <div className="invoice-doc-muted">{vm.billToPhone}</div>}
          {vm.billToEmail && <div className="invoice-doc-muted">{vm.billToEmail}</div>}
          {vm.billToAddress && <div className="invoice-doc-muted">{vm.billToAddress}</div>}
        </div>
        <div>
          <div className="invoice-doc-label">Service details</div>
          <div className="invoice-doc-muted">Date: {vm.serviceDateLabel}</div>
          <div className="invoice-doc-muted">Vehicle: {vm.vehicleLabel}</div>
          <div className="invoice-doc-muted">Location: {vm.locationLabel}</div>
          <div className="invoice-doc-context">{vm.serviceContextLine}</div>
        </div>
      </div>

      <div className="invoice-doc-table">
        <div className="invoice-doc-table-head">
          <span>Description</span>
          <span>Amount</span>
        </div>
        {vm.lineItems.map((item, i) => (
          <div key={i} className="invoice-doc-table-row">
            <div className="invoice-doc-table-desc">
              <span>{item.description}</span>
              {item.note && <span className="invoice-doc-line-note">{item.note}</span>}
            </div>
            <span className="invoice-doc-table-amount">{formatInvoiceMoney(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="invoice-doc-summary">
        <div className="invoice-doc-summary-row">
          <span className="invoice-doc-muted">Subtotal</span>
          <span>{formatInvoiceMoney(vm.subtotal)}</span>
        </div>
        {vm.showTip && (
          <div className="invoice-doc-summary-row">
            <span className="invoice-doc-muted">Tip</span>
            <span>{formatInvoiceMoney(vm.tip)}</span>
          </div>
        )}
        <div className="invoice-doc-summary-divider" />
        <div className="invoice-doc-summary-row invoice-doc-summary-total">
          <span>Total</span>
          <span>{formatInvoiceMoney(vm.total)}</span>
        </div>
        <div className="invoice-doc-summary-row">
          <span className="invoice-doc-muted">Balance due</span>
          <CurrencyAmount
            value={vm.balanceDue}
            variant={vm.balanceDue > 0 ? 'expense' : 'revenue'}
            unsigned={vm.balanceDue >= 0}
          />
        </div>
      </div>

      {vm.showPayments && (
        <div className="invoice-doc-payments">
          <div className="invoice-doc-label">Payments</div>
          {vm.payments.map((p, i) => (
            <div key={i} className="invoice-doc-summary-row">
              <span className="invoice-doc-muted">
                {p.method} · {p.date}
              </span>
              <CurrencyAmount value={p.amount} variant="revenue" />
            </div>
          ))}
        </div>
      )}

      <div className="invoice-doc-footer">
        {vm.termsFooter && <p>{vm.termsFooter}</p>}
        {vm.questionsLine && <p>{vm.questionsLine}</p>}
        {vm.portalUrl && (
          <p className="invoice-doc-portal">
            <a
              href={vm.portalUrl}
              className="invoice-doc-portal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View your invoice online
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
