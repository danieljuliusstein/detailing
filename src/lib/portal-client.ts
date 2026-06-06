import { getInternalApiSecret } from './export-data'

export type PortalScope = 'job' | 'photos' | 'invoice' | 'quote' | 'full'

export interface CreatePortalLinkResult {
  url: string
  token: string
  expiresAt: string
}

export async function createShareLink(input: {
  clientId: string
  scope: PortalScope
  jobId?: string
  quoteId?: string
}): Promise<CreatePortalLinkResult> {
  const secret = getInternalApiSecret()
  const res = await fetch('/api/portal/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-api-secret': secret } : {}),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Failed to create link (${res.status})`)
  }

  return res.json()
}

export async function copyShareLink(url: string): Promise<void> {
  await navigator.clipboard.writeText(url)
}

export async function emailShareLink(input: {
  to: string
  clientName: string
  businessName: string
  portalUrl: string
  subject?: string
  message?: string
}): Promise<void> {
  const secret = getInternalApiSecret()
  const res = await fetch('/api/portal/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-api-secret': secret } : {}),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to send email')
  }
}
