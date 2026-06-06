import type { AppSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'

export async function downloadQuotePdf(quote: QuoteWithRelations, settings: AppSettings): Promise<void> {
  const res = await fetch('/api/pdf/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quote, settings }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'PDF export failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${quote.quote_number}.pdf`.replace(/[^\w.-]/g, '_')
  a.click()
  URL.revokeObjectURL(url)
}
