import { NextResponse } from 'next/server'
import { getOrganizationBySlug } from '@/lib/server/organization'
import { getPublicBusinessInfoForOrg } from '@/lib/server/booking-public'
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
  try {
    const business = await getPublicBusinessInfoForOrg(org.id, org.slug)
    return jsonWithCors(request, { business, slug: org.slug })
  } catch {
    return jsonWithCors(request, { error: 'Failed to load business' }, 500)
  }
}
