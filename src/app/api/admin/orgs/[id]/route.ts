import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await authenticateRequestUser(request)
  if (!auth || !isPlatformAdminEmail(auth.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  let body: {
    booking_enabled?: boolean
    plan?: string
    trial_ends_at?: string
    subscription_status?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  if (typeof body.booking_enabled === 'boolean') payload.booking_enabled = body.booking_enabled
  if (body.plan === 'founding' || body.plan === 'starter' || body.plan === 'pro') payload.plan = body.plan
  if (body.trial_ends_at) payload.trial_ends_at = body.trial_ends_at
  if (body.subscription_status) payload.subscription_status = body.subscription_status

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const pb = await authenticateServerAdmin()
  const updated = await pb.collection('organizations').update(id, payload)
  return NextResponse.json({ org: updated })
}
