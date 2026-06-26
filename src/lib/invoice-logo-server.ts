import { readFileSync } from 'fs'
import { join } from 'path'
import { streamBusinessLogo } from './server/portal-data'

const DEFAULT_LOGO_PATH = join(process.cwd(), 'public', 'logo.png')

function slugFromLogoUrl(logoUrl?: string | null): string | undefined {
  if (!logoUrl?.includes('/api/business-logo')) return undefined
  try {
    const parsed = logoUrl.startsWith('http')
      ? new URL(logoUrl)
      : new URL(logoUrl, 'http://localhost')
    const slug = parsed.searchParams.get('slug')?.trim()
    return slug || undefined
  } catch {
    return undefined
  }
}

/** Resolve business logo to a data URI for @react-pdf/renderer (falls back to app mark). */
export async function resolveInvoiceLogoDataUri(logoUrl?: string | null): Promise<string> {
  const slug = slugFromLogoUrl(logoUrl)
  if (logoUrl?.includes('/api/business-logo') || logoUrl?.includes('/api/portal/business-logo') || !logoUrl?.trim()) {
    const streamed = await streamBusinessLogo(slug)
    if (streamed) {
      const buf = Buffer.from(streamed.bytes)
      return `data:${streamed.contentType};base64,${buf.toString('base64')}`
    }
  }

  if (logoUrl?.trim()) {
    try {
      const res = await fetch(logoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const contentType = res.headers.get('content-type')?.split(';')[0] || 'image/png'
        return `data:${contentType};base64,${buf.toString('base64')}`
      }
    } catch {
      // fall through to default
    }
  }

  const buf = readFileSync(DEFAULT_LOGO_PATH)
  return `data:image/png;base64,${buf.toString('base64')}`
}
