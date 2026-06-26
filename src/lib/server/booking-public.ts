import { authenticateServerAdmin } from './pocketbase-admin'
import { escapeFilterValue, appJobCreateToPb, pbClientToApp, pbJobToApp, pbPackageToApp, type PbRecord } from '../api/mappers'
import { BOOKING_SLOT_TIMES, type AvailabilitySlot, type PublicBookingInput, type PublicBusinessInfo, type PublicPackage } from '../booking-public'

function slotLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const dt = new Date()
  dt.setHours(h, m ?? 0, 0, 0)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function orgFilter(organizationId: string, extra?: string): string {
  const orgEsc = escapeFilterValue(organizationId)
  const base = `organization_id = "${orgEsc}"`
  return extra ? `${base} && (${extra})` : base
}

export async function getPublicBusinessInfoForOrg(
  organizationId: string,
  orgSlug: string
): Promise<PublicBusinessInfo | null> {
  const pb = await authenticateServerAdmin()
  const records = await pb.collection('app_settings').getFullList<PbRecord>({
    filter: orgFilter(organizationId),
    limit: 1,
  })
  if (!records.length) return null
  const record = records[0]
  const hasLogo = typeof record.logo === 'string' && record.logo
  return {
    name: String(record.business_name ?? ''),
    phone: String(record.business_phone ?? ''),
    email: String(record.business_email ?? ''),
    address: String(record.business_address ?? ''),
    logoUrl: hasLogo
      ? `/api/business-logo?slug=${encodeURIComponent(orgSlug)}`
      : '/logo.png',
  }
}

export async function listPublicPackagesForOrg(organizationId: string): Promise<PublicPackage[]> {
  const pb = await authenticateServerAdmin()
  const records = await pb.collection('packages').getFullList<PbRecord>({
    filter: orgFilter(organizationId, 'active = true'),
    sort: 'name',
  })
  return records.map(pbPackageToApp).map((p) => ({
    id: p.id,
    name: p.name,
    base_price: p.base_price,
    description: p.description,
  }))
}

export async function getAvailabilityForOrg(organizationId: string, date: string): Promise<AvailabilitySlot[]> {
  const pb = await authenticateServerAdmin()
  const escaped = escapeFilterValue(date)
  const jobs = await pb.collection('jobs').getFullList<PbRecord>({
    filter: orgFilter(
      organizationId,
      `date = "${escaped}" && (status = "scheduled" || status = "in_progress")`,
    ),
  })

  const taken = new Set(
    jobs.map((j) => String(j.start_time ?? '').trim()).filter(Boolean),
  )

  return BOOKING_SLOT_TIMES.map((time) => ({
    time,
    label: slotLabel(time),
    available: !taken.has(time),
  }))
}

export async function createPublicBookingForOrg(organizationId: string, input: PublicBookingInput) {
  const pb = await authenticateServerAdmin()

  const pkg = await pb.collection('packages').getOne<PbRecord>(input.packageId)
  if (String(pkg.organization_id) !== organizationId) {
    throw new Error('Invalid package')
  }
  const packageApp = pbPackageToApp(pkg)

  const phone = input.phone.trim()
  const name = input.name.trim()
  if (!name || !phone) throw new Error('Name and phone are required')

  const phoneEsc = escapeFilterValue(phone)
  let clientRecord: PbRecord | null = null
  const matches = await pb.collection('clients').getFullList<PbRecord>({
    filter: orgFilter(organizationId, `phone = "${phoneEsc}"`),
    limit: 1,
  })

  if (matches.length > 0) {
    clientRecord = matches[0]
    await pb.collection('clients').update(clientRecord.id, {
      name,
      email: input.email?.trim() ?? clientRecord.email ?? '',
      address: input.address?.trim() ?? clientRecord.address ?? '',
    })
  } else {
    clientRecord = await pb.collection('clients').create<PbRecord>({
      organization_id: organizationId,
      name,
      phone,
      email: input.email?.trim() ?? '',
      address: input.address?.trim() ?? '',
      lead_source: 'website',
      tags: [],
      notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
    })
  }

  const client = pbClientToApp(clientRecord)
  const slots = await getAvailabilityForOrg(organizationId, input.date)
  const slot = slots.find((s) => s.time === input.startTime)
  if (!slot?.available) throw new Error('That time slot is no longer available')

  const payload = appJobCreateToPb({
    date: input.date,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: client.id,
    status: 'scheduled',
    revenue: packageApp.base_price,
    tip: 0,
    start_time: input.startTime,
    notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
  })

  const jobRecord = await pb.collection('jobs').create<PbRecord>({
    ...(payload as Record<string, unknown>),
    organization_id: organizationId,
  })
  const job = pbJobToApp(jobRecord)

  return {
    jobId: job.id,
    clientId: client.id,
    date: job.date,
    startTime: job.start_time,
    packageName: packageApp.name,
    clientName: client.name,
  }
}
