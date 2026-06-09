import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoicePdfDocument from '@/components/pdf/InvoicePdfDocument'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const job = body.job as JobWithRelations | undefined
    const invoice = body.invoice as Invoice | undefined
    const settings = body.settings as AppSettings | undefined

    if (!job || !invoice || !settings) {
      return NextResponse.json({ error: 'Missing invoice data' }, { status: 400 })
    }

    const logoDataUri = await resolveInvoiceLogoDataUri(settings.logo_url)
    const portalUrl = typeof body.portalUrl === 'string' ? body.portalUrl : undefined

    const buffer = await renderToBuffer(
      <InvoicePdfDocument
        job={job}
        invoice={invoice}
        settings={settings}
        logoDataUri={logoDataUri}
        portalUrl={portalUrl}
      />
    )

    const filename = `${invoice.invoice_number}.pdf`.replace(/[^\w.-]/g, '_')

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[api/pdf/invoice]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
