import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { createPortalToken } from '@/lib/server/portal-tokens'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const body = await request.json()
    const { clientId, scope, jobId, quoteId } = body

    if (!clientId || !scope) {
      return NextResponse.json({ error: 'clientId and scope required' }, { status: 400 })
    }

    const result = await createPortalToken({
      clientId,
      scope,
      jobId,
      quoteId,
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Create failed' },
      { status: 500 }
    )
  }
}
