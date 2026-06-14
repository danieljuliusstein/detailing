import { getPublicBusinessInfo } from '@/lib/booking-public'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function GET(request: Request) {
  try {
    const business = await getPublicBusinessInfo()
    return jsonWithCors(request, { business })
  } catch (e) {
    return jsonWithCors(
      request,
      { error: e instanceof Error ? e.message : 'Failed to load business info' },
      500
    )
  }
}
