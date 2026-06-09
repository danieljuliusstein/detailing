import { randomBytes } from 'crypto'
import { authenticateServerPocketBase } from './pocketbase-admin'

export type PortalScope = 'job' | 'photos' | 'invoice' | 'quote' | 'full'

export interface PortalTokenRecord {
  id: string
  token: string
  scope: PortalScope
  job_id?: string
  quote_id?: string
  client_id: string
  expires_at: string
  revoked: boolean
}

function generateToken(): string {
  return randomBytes(24).toString('base64url')
}

function expiresAt(days = 90): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '')
}

/** Prefer the incoming request host so portal asset URLs match how the client opened the link. */
export async function getRequestAppBaseUrl(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'
    if (host) return `${proto}://${host}`.replace(/\/$/, '')
  } catch {
    // headers() unavailable outside a request
  }
  return getAppBaseUrl()
}

export async function createPortalToken(input: {
  clientId: string
  scope: PortalScope
  jobId?: string
  quoteId?: string
}): Promise<{ token: string; url: string; expiresAt: string; id: string }> {
  const pb = await authenticateServerPocketBase()
  const token = generateToken()
  const exp = expiresAt()

  const payload: Record<string, unknown> = {
    token,
    scope: input.scope,
    client_id: input.clientId,
    expires_at: exp,
    revoked: false,
  }
  if (input.jobId) payload.job_id = input.jobId
  if (input.quoteId) payload.quote_id = input.quoteId

  const record = await pb.collection('portal_tokens').create<PortalTokenRecord>(payload)

  return {
    id: record.id,
    token,
    expiresAt: exp,
    url: `${getAppBaseUrl()}/portal/${token}`,
  }
}

export async function validatePortalToken(token: string): Promise<PortalTokenRecord | null> {
  if (!token || token.length < 16) return null

  const pb = await authenticateServerPocketBase()
  try {
    const records = await pb.collection('portal_tokens').getFullList<PortalTokenRecord>({
      filter: `token = "${token.replace(/"/g, '\\"')}"`,
      limit: 1,
    })
    const record = records[0]
    if (!record || record.revoked) return null

    const today = new Date().toISOString().slice(0, 10)
    if (record.expires_at && record.expires_at < today) return null

    return record
  } catch {
    return null
  }
}

export async function revokePortalToken(token: string): Promise<boolean> {
  const record = await validatePortalToken(token)
  if (!record) return false

  const pb = await authenticateServerPocketBase()
  await pb.collection('portal_tokens').update(record.id, { revoked: true })
  return true
}
