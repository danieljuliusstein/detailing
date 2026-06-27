import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import type { PbRecord } from '@/lib/api/mappers'

export const runtime = 'nodejs'

async function requirePlatformAdmin(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth || !isPlatformAdminEmail(auth.email)) return null
  return auth
}

export async function GET(request: Request) {
  const auth = await requirePlatformAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pb = await authenticateServerAdmin()
  const orgs = await pb.collection('organizations').getFullList<PbRecord>({ sort: '-created' })

  return NextResponse.json({
    orgs: orgs.map((org) => ({
      id: org.id,
      name: String(org.name ?? ''),
      slug: String(org.slug ?? ''),
      plan: String(org.plan ?? ''),
      subscription_status: String(org.subscription_status ?? 'none'),
      trial_ends_at: org.trial_ends_at ? String(org.trial_ends_at) : null,
      current_period_end: org.current_period_end ? String(org.current_period_end) : null,
      founding_member: org.founding_member === true,
      booking_enabled: org.booking_enabled !== false,
      created: org.created,
    })),
    summary: {
      total: orgs.length,
      active: orgs.filter((o) => o.subscription_status === 'active').length,
      trialing: orgs.filter((o) => o.subscription_status === 'trialing').length,
    },
  })
}
