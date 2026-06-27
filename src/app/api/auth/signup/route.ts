import { NextResponse } from 'next/server'
import { registerOrganization } from '@/lib/server/signup'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'

export async function POST(request: Request) {
  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  const ip = getClientIp(request)
  const limited = enforceRateLimit(`signup:${ip}`, RATE_LIMITS.signup)
  if (limited) return limited

  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      businessName?: string
      slug?: string
    }

    const result = await registerOrganization({
      email: String(body.email ?? ''),
      password: String(body.password ?? ''),
      businessName: String(body.businessName ?? ''),
      slug: body.slug ? String(body.slug) : undefined,
    })

    return NextResponse.json({ ok: true, slug: result.slug, email: result.email })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Signup failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
