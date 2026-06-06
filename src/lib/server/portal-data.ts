import { authenticateServerPocketBase } from './pocketbase-admin'
import type { PortalScope, PortalTokenRecord } from './portal-tokens'

export interface PortalPhoto {
  filename: string
  type: 'before' | 'after'
  url: string
}

export interface PortalPayload {
  scope: PortalScope
  business: {
    name: string
    phone: string
    email: string
    address: string
    logoUrl?: string
    termsFooter?: string
  }
  client: { name: string }
  job?: {
    id: string
    date: string
    vehicleType: string
    locationType: string
    packageName: string
    revenue: number
    tip: number
    status: string
  }
  invoice?: {
    invoiceNumber: string
    subtotal: number
    tip: number
    total: number
    amountPaid: number
    balanceDue: number
    status: string
  }
  quote?: {
    id: string
    quoteNumber: string
    subtotal: number
    date: string
    validUntil?: string
    status: string
    packageName: string
    vehicleType: string
    notes?: string
  }
  photos: PortalPhoto[]
}

async function loadSettings(pb: Awaited<ReturnType<typeof authenticateServerPocketBase>>) {
  const records = await pb.collection('app_settings').getFullList({ limit: 1 })
  const s = records[0]
  if (!s) {
    return {
      name: 'Detailing',
      phone: '',
      email: '',
      address: '',
      logoUrl: undefined as string | undefined,
      termsFooter: undefined as string | undefined,
    }
  }

  let logoUrl: string | undefined
  const logo = s.logo
  if (typeof logo === 'string' && logo) {
    logoUrl = pb.files.getURL(s, logo)
  }

  return {
    name: String(s.business_name ?? 'Detailing'),
    phone: String(s.business_phone ?? ''),
    email: String(s.business_email ?? ''),
    address: String(s.business_address ?? ''),
    logoUrl,
    termsFooter: String(s.invoice_terms_footer ?? ''),
  }
}

export async function buildPortalPayload(
  tokenRecord: PortalTokenRecord,
  appBaseUrl: string
): Promise<PortalPayload | null> {
  const pb = await authenticateServerPocketBase()
  const business = await loadSettings(pb)
  const scope = tokenRecord.scope

  let clientName = 'Client'
  try {
    const client = await pb.collection('clients').getOne(tokenRecord.client_id)
    clientName = String(client.name ?? 'Client')
  } catch {
    return null
  }

  const payload: PortalPayload = {
    scope,
    business,
    client: { name: clientName },
    photos: [],
  }

  if (tokenRecord.quote_id && (scope === 'quote' || scope === 'full')) {
    try {
      const quote = await pb.collection('quotes').getOne(tokenRecord.quote_id, {
        expand: 'package_id',
      })
      const pkg = quote.expand?.package_id
      payload.quote = {
        id: quote.id,
        quoteNumber: String(quote.quote_number),
        subtotal: Number(quote.subtotal),
        date: String(quote.date),
        validUntil: quote.valid_until ? String(quote.valid_until) : undefined,
        status: String(quote.status),
        packageName: pkg ? String(pkg.name) : '—',
        vehicleType: String(quote.vehicle_type),
        notes: quote.notes ? String(quote.notes) : undefined,
      }
    } catch {
      // quote optional
    }
  }

  if (tokenRecord.job_id) {
    try {
      const job = await pb.collection('jobs').getOne(tokenRecord.job_id, {
        expand: 'package_id,invoice_id',
      })
      const pkg = job.expand?.package_id

      if (scope !== 'quote') {
        payload.job = {
          id: job.id,
          date: String(job.date),
          vehicleType: String(job.vehicle_type),
          locationType: String(job.location_type),
          packageName: pkg ? String(pkg.name) : '—',
          revenue: Number(job.revenue),
          tip: Number(job.tip ?? 0),
          status: String(job.status),
        }
      }

      if ((scope === 'invoice' || scope === 'full' || scope === 'job') && job.expand?.invoice_id) {
        const inv = job.expand.invoice_id
        payload.invoice = {
          invoiceNumber: String(inv.invoice_number),
          subtotal: Number(inv.subtotal),
          tip: Number(inv.tip ?? 0),
          total: Number(inv.total),
          amountPaid: Number(inv.amount_paid ?? 0),
          balanceDue: Number(inv.balance_due ?? 0),
          status: String(inv.status),
        }
      } else if (job.invoice_id && (scope === 'invoice' || scope === 'full')) {
        const inv = await pb.collection('invoices').getOne(String(job.invoice_id))
        payload.invoice = {
          invoiceNumber: String(inv.invoice_number),
          subtotal: Number(inv.subtotal),
          tip: Number(inv.tip ?? 0),
          total: Number(inv.total),
          amountPaid: Number(inv.amount_paid ?? 0),
          balanceDue: Number(inv.balance_due ?? 0),
          status: String(inv.status),
        }
      }

      if (scope === 'photos' || scope === 'full' || scope === 'job') {
        const filenames = Array.isArray(job.photos) ? (job.photos as string[]) : []
        const meta = Array.isArray(job.photo_meta) ? (job.photo_meta as { filename: string; type: string }[]) : []
        payload.photos = filenames.map((filename) => {
          const entry = meta.find((m) => m.filename === filename)
          return {
            filename,
            type: (entry?.type === 'before' ? 'before' : 'after') as 'before' | 'after',
            url: `${appBaseUrl}/api/portal/${tokenRecord.token}/photo/${encodeURIComponent(filename)}`,
          }
        })
      }
    } catch {
      if (!tokenRecord.quote_id) return null
    }
  }

  return payload
}

export async function streamPortalPhoto(
  token: string,
  filename: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const { validatePortalToken } = await import('./portal-tokens')
  const record = await validatePortalToken(token)
  if (!record?.job_id) return null

  const pb = await authenticateServerPocketBase()
  const job = await pb.collection('jobs').getOne(record.job_id)
  const photos = Array.isArray(job.photos) ? (job.photos as string[]) : []
  if (!photos.includes(filename)) return null

  const url = pb.files.getURL(job, filename)
  const res = await fetch(url, {
    headers: { Authorization: pb.authStore.token },
  })
  if (!res.ok) return null

  const bytes = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  return { bytes, contentType }
}
