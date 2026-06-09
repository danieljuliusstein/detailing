import PortalView from '@/components/portal/PortalView'
import PortalErrorScreen from '@/components/portal/PortalErrorScreen'
import { buildPortalPayload, loadPortalBusiness } from '@/lib/server/portal-data'
import { getRequestAppBaseUrl, validatePortalToken } from '@/lib/server/portal-tokens'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const record = await validatePortalToken(token)

  if (!record) {
    const baseUrl = await getRequestAppBaseUrl()
    const business = await loadPortalBusiness(baseUrl).catch(() => undefined)
    return <PortalErrorScreen type="LINK_EXPIRED" business={business} />
  }

  const payload = await buildPortalPayload(record, await getRequestAppBaseUrl())
  if (!payload) {
    const baseUrl = await getRequestAppBaseUrl()
    const business = await loadPortalBusiness(baseUrl).catch(() => undefined)
    return <PortalErrorScreen type="UNAVAILABLE" business={business} />
  }

  return <PortalView payload={payload} token={token} />
}
