import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QuotePdfDocument from '@/components/pdf/QuotePdfDocument'
import type { AppSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const quote = body.quote as QuoteWithRelations | undefined
    const settings = body.settings as AppSettings | undefined

    if (!quote || !settings) {
      return NextResponse.json({ error: 'Missing quote data' }, { status: 400 })
    }

    const buffer = await renderToBuffer(<QuotePdfDocument quote={quote} settings={settings} />)
    const filename = `${quote.quote_number}.pdf`.replace(/[^\w.-]/g, '_')

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[api/pdf/quote]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
