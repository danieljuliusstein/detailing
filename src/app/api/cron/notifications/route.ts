import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { runNotificationsCron } from '@/lib/server/notifications-cron'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const result = await runNotificationsCron()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Cron failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
