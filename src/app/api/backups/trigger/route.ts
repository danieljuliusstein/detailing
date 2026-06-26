import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { createPocketBaseBackup } from '@/lib/server/backup'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') ?? undefined
    const backup = await createPocketBaseBackup(organizationId)
    const filename = `detailing-backup-${backup.exported_at.slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backup failed' },
      { status: 500 }
    )
  }
}

/** GET returns backup metadata without download (health check) */
export async function GET(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') ?? undefined
    const backup = await createPocketBaseBackup(organizationId)
    const counts = Object.fromEntries(
      Object.entries(backup.collections).map(([k, v]) => [k, v.length])
    )
    return NextResponse.json({
      ok: true,
      exported_at: backup.exported_at,
      counts,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backup failed' },
      { status: 500 }
    )
  }
}
