import { getOrganizationBySlug } from '@/lib/server/organization'
import { getAvailabilityForOrg } from '@/lib/server/booking-public'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

type Params = { params: Promise<{ slug: string }> }

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) {
    return jsonWithCors(request, { error: 'Not found' }, 404)
  }

  const url = new URL(request.url)
  const date = url.searchParams.get('date')?.trim() ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonWithCors(request, { error: 'Invalid date' }, 400)
  }

  try {
    const slots = await getAvailabilityForOrg(org.id, date)
    return jsonWithCors(request, { date, slots })
  } catch {
    return jsonWithCors(request, { error: 'Failed to load availability' }, 500)
  }
}
