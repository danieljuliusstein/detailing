import { pdf } from '@react-pdf/renderer'
import InvoicePdfDocument from '@/components/pdf/InvoicePdfDocument'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

export async function downloadInvoicePdf(
  job: JobWithRelations,
  invoice: Invoice,
  settings: AppSettings
) {
  const blob = await pdf(
    InvoicePdfDocument({ job, invoice, settings })
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.invoice_number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
