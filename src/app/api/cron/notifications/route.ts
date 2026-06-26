import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { runNotificationsCron } from '@/lib/server/notifications-cron'
import { runAutoMessagesCron } from '@/lib/server/auto-messages'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const result = await runNotificationsCron()
    const messages = await runAutoMessagesCron()
    return NextResponse.json({
      ok: true,
      ...result,
      messagesSent: messages.sent,
      messagesFailed: messages.failed,
      details: [...result.details, ...messages.details],
    })
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
