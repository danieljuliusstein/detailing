import { triggerDownload } from '@/lib/pdf/triggerDownload'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

export async function downloadInvoicePdf(
  job: JobWithRelations,
  invoice: Invoice,
  settings: AppSettings,
  portalUrl?: string
): Promise<void> {
  const res = await fetch('/api/pdf/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job, invoice, settings, portalUrl }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'PDF export failed')
  }

  const blob = await res.blob()
  triggerDownload(blob, `${invoice.invoice_number}.pdf`)
}
