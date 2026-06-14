import { createPublicBooking, type PublicBookingInput } from '@/lib/booking-public'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PublicBookingInput>
    const input = {
      packageId: String(body.packageId ?? ''),
      date: String(body.date ?? ''),
      startTime: String(body.startTime ?? ''),
      locationType: body.locationType === 'fixed' ? 'fixed' : 'mobile',
      vehicleType: String(body.vehicleType ?? 'sedan'),
      name: String(body.name ?? ''),
      phone: String(body.phone ?? ''),
      email: body.email ? String(body.email) : undefined,
      address: body.address ? String(body.address) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
    } as PublicBookingInput

    const result = await createPublicBooking(input)
    return jsonWithCors(request, { ok: true, booking: result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Booking failed'
    const status = message.includes('no longer available') ? 409 : 400
    return jsonWithCors(request, { error: message }, status)
  }
}
