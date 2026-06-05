import { NextResponse } from 'next/server'
import { removePushSubscription, savePushSubscription } from '@/lib/server/push'
import type { PushSubscriptionJSON } from '@/lib/server/push'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = body.subscription as PushSubscriptionJSON | undefined

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await savePushSubscription(subscription)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Subscribe failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const endpoint = body.endpoint as string | undefined
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    await removePushSubscription(endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unsubscribe failed' },
      { status: 500 }
    )
  }
}
