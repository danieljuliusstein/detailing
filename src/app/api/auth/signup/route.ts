import { NextResponse } from 'next/server'
import { registerOrganization } from '@/lib/server/signup'

const rateLimit = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.reset) {
    rateLimit.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many signups. Try again later.' }, { status: 429 })
  }

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
