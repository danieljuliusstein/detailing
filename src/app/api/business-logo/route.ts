import { NextResponse } from 'next/server'
import { streamBusinessLogo } from '@/lib/server/portal-data'

/** Public business logo — used by portal, invoices, and settings preview. */
export async function GET() {
  const result = await streamBusinessLogo()
  if (!result) {
    return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
  }

  return new NextResponse(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
