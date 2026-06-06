import PortalView from '@/components/portal/PortalView'
import { buildPortalPayload } from '@/lib/server/portal-data'
import { getAppBaseUrl, validatePortalToken } from '@/lib/server/portal-tokens'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const record = await validatePortalToken(token)

  if (!record) {
    return (
      <div className="screen page-content" style={{ paddingTop: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Link expired or invalid</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Please contact the business for a new link.
        </div>
      </div>
    )
  }

  const payload = await buildPortalPayload(record, getAppBaseUrl())
  if (!payload) {
    return (
      <div className="screen page-content" style={{ paddingTop: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Content unavailable</div>
      </div>
    )
  }

  return <PortalView payload={payload} token={token} />
}
