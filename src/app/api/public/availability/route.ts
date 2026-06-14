import { getAvailabilityForDate } from '@/lib/booking-public'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')?.trim()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonWithCors(request, { error: 'date query required (YYYY-MM-DD)' }, 400)
  }

  try {
    const slots = await getAvailabilityForDate(date)
    return jsonWithCors(request, { date, slots })
  } catch (e) {
    return jsonWithCors(
      request,
      { error: e instanceof Error ? e.message : 'Failed to load availability' },
      500
    )
  }
}
