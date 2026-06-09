import type { PortalPayload } from '@/lib/server/portal-data'
import {
  portalBalancePanelClass,
  portalInvoiceBadgeClass,
  portalMoney,
} from '@/lib/portal-display'

export default function PortalInvoiceCard({
  invoice,
  job,
  showPayPlaceholder = false,
  businessPhone,
}: {
  invoice: NonNullable<PortalPayload['invoice']>
  job?: PortalPayload['job']
  showPayPlaceholder?: boolean
  businessPhone?: string
}) {
  const balanceVariant = portalBalancePanelClass(invoice.status, invoice.balanceDue)
  const lineDesc = job?.packageName ?? 'Detailing service'

  return (
    <div className="portal-card">
      <div className="portal-card-inner">
        <div className="portal-card-header-row">
          <div className="portal-section-label" style={{ marginBottom: 0 }}>
            Invoice
          </div>
          <span className={portalInvoiceBadgeClass(invoice.status)}>
            {invoice.status === 'paid' || invoice.balanceDue <= 0 ? 'PAID' : invoice.status.toUpperCase()}
          </span>
        </div>
        <div className="portal-inv-number">{invoice.invoiceNumber}</div>

        <table className="portal-invoice-table">
          <tbody>
            <tr>
              <td className="portal-line-desc">{lineDesc}</td>
              <td className="portal-line-amt">{portalMoney(invoice.subtotal)}</td>
            </tr>
            {invoice.tip > 0 && (
              <tr>
                <td className="portal-line-desc portal-line-desc--sub">Tip</td>
                <td className="portal-line-amt portal-line-amt--sub">{portalMoney(invoice.tip)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr className="portal-invoice-divider" />

        <div className="portal-total-row">
          <span className="portal-total-label">Subtotal</span>
          <span className="portal-total-amount">{portalMoney(invoice.subtotal)}</span>
        </div>
        {invoice.tip > 0 && (
          <div className="portal-total-row">
            <span className="portal-total-label">Tip</span>
            <span className="portal-total-amount">{portalMoney(invoice.tip)}</span>
          </div>
        )}
        <div className="portal-total-row portal-total-border-row">
          <span className="portal-total-label--strong">Total</span>
          <span className="portal-total-amount portal-total-amount--grand">{portalMoney(invoice.total)}</span>
        </div>
        {invoice.amountPaid > 0 && (
          <div className="portal-total-row">
            <span className="portal-total-label">Paid</span>
            <span className="portal-total-amount portal-total-amount--credit">
              {portalMoney(invoice.amountPaid)}
            </span>
          </div>
        )}

        {balanceVariant && (
          <div className={`portal-balance-panel portal-balance-panel--${balanceVariant}`}>
            <span className="portal-balance-label">Balance due</span>
            <span className="portal-balance-amount">{portalMoney(invoice.balanceDue)}</span>
          </div>
        )}

        {showPayPlaceholder && invoice.balanceDue > 0 && (
          <div className="portal-pay-placeholder">
            <div className="portal-pay-placeholder__label">Pay online — coming soon</div>
            <div className="portal-pay-placeholder__hint">
              {businessPhone ? `Contact us to pay: ${businessPhone}` : 'Contact us to pay'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
