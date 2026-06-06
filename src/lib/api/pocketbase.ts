import { normalizeInvoice } from '../invoices'
import {
  buildSupplyExpenseLine,
  isCompletingJob,
  mergeSupplyExpense,
  overheadAmountForDates,
  resolveSuppliesUsed,
} from '../supplies-logic'
import { ensurePocketBaseAuth } from '../pb-auth'
import { getPocketBase } from '../pocketbase'
import {
  computeDashboard,
  computeJobsCSV,
  computeJobsForDate,
  computePLReport,
  computePLReportForDates,
  computeWeekDays,
  priorRangeFor,
  rangeFor,
} from './aggregates'
import {
  appJobCreateToPb,
  appJobEditToPb,
  escapeFilterValue,
  pbClientToApp,
  pbInvoiceToApp,
  pbJobToApp,
  pbJobToAppWithRelations,
  pbPackageToApp,
  type PbRecord,
} from './mappers'
import type {
  Client,
  ClientWithStats,
  DashboardKpis,
  Invoice,
  Job,
  JobEditData,
  JobWithRelations,
  Package,
  QuickJobData,
  RecentJobRow,
  WeekDay,
} from '../types'
import type { DateRangeKey } from './reports'
import * as overheadPb from './overhead-pocketbase'

const JOB_EXPAND = 'client_id,package_id,invoice_id'

function pb() {
  const client = getPocketBase()
  if (!client || !client.authStore.isValid) {
    throw new Error('PocketBase not authenticated')
  }
  return client
}

async function fetchJobsExpanded(): Promise<JobWithRelations[]> {
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    sort: '-date',
    expand: JOB_EXPAND,
  })
  return records.map(pbJobToAppWithRelations)
}

async function fetchInvoices(): Promise<Invoice[]> {
  const records = await pb().collection('invoices').getFullList<PbRecord>({ sort: '-id' })
  return records.map((r) => normalizeInvoice(pbInvoiceToApp(r)))
}

async function fetchJobsRaw(): Promise<Job[]> {
  const records = await pb().collection('jobs').getFullList<PbRecord>({ sort: '-date' })
  return records.map(pbJobToApp)
}

export async function getPackages(): Promise<Package[]> {
  const records = await pb().collection('packages').getFullList<PbRecord>({
    filter: 'active = true',
    sort: 'name',
  })
  return records.map(pbPackageToApp)
}

export async function getClients(): Promise<Client[]> {
  const records = await pb().collection('clients').getFullList<PbRecord>({ sort: '-id' })
  return records.map(pbClientToApp)
}

export async function getRecentClients(limit: number): Promise<Client[]> {
  const clients = await getClients()
  return clients.slice(0, limit)
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    const record = await pb().collection('clients').getOne<PbRecord>(id)
    return pbClientToApp(record)
  } catch {
    return null
  }
}

export async function getJobs(): Promise<JobWithRelations[]> {
  return fetchJobsExpanded()
}

export async function getJob(id: string): Promise<JobWithRelations | null> {
  try {
    const record = await pb().collection('jobs').getOne<PbRecord>(id, { expand: JOB_EXPAND })
    return pbJobToAppWithRelations(record)
  } catch {
    return null
  }
}

export async function createClient(input: import('../types').ClientInput): Promise<Client> {
  const trimmed = input.name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const payload: Record<string, unknown> = {
    name: trimmed,
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    tags: input.tags ?? [],
    notes: input.notes ?? '',
  }
  if (input.lead_source) payload.lead_source = input.lead_source

  const created = await pb().collection('clients').create<PbRecord>(payload)
  return pbClientToApp(created)
}

export async function updateClient(id: string, input: Partial<import('../types').ClientInput>): Promise<Client | null> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.email !== undefined) payload.email = input.email
    if (input.address !== undefined) payload.address = input.address
    if (input.lead_source) payload.lead_source = input.lead_source
    if (input.tags !== undefined) payload.tags = input.tags
    if (input.notes !== undefined) payload.notes = input.notes

    const record = await pb().collection('clients').update<PbRecord>(id, payload)
    return pbClientToApp(record)
  } catch {
    return null
  }
}

export async function getAllPackages(): Promise<Package[]> {
  const records = await pb().collection('packages').getFullList<PbRecord>({ sort: 'name' })
  return records.map(pbPackageToApp)
}

export async function createPackage(input: import('../types').PackageInput): Promise<Package> {
  const created = await pb().collection('packages').create<PbRecord>({
    name: input.name.trim(),
    base_price: input.base_price,
    description: input.description ?? '',
    default_supplies: input.default_supplies ?? [],
    active: input.active !== false,
  })
  return pbPackageToApp(created)
}

export async function updatePackage(id: string, input: Partial<import('../types').PackageInput>): Promise<Package | null> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.base_price !== undefined) payload.base_price = input.base_price
    if (input.description !== undefined) payload.description = input.description
    if (input.default_supplies !== undefined) payload.default_supplies = input.default_supplies
    if (input.active !== undefined) payload.active = input.active

    const record = await pb().collection('packages').update<PbRecord>(id, payload)
    return pbPackageToApp(record)
  } catch {
    return null
  }
}

export async function findOrCreateClient(name: string, existingId: string | null): Promise<Client> {
  if (existingId) {
    const existing = await getClient(existingId)
    if (existing) return existing
  }

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const escaped = escapeFilterValue(trimmed)
  const matches = await pb().collection('clients').getFullList<PbRecord>({
    filter: `name = "${escaped}"`,
    limit: 1,
  })
  if (matches.length > 0) return pbClientToApp(matches[0])

  const created = await pb().collection('clients').create<PbRecord>({ name: trimmed })
  return pbClientToApp(created)
}

export async function createJob(input: QuickJobData): Promise<Job> {
  const client = await findOrCreateClient(input.clientName, input.clientId)
  const payload = appJobCreateToPb({
    date: input.date,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: client.id,
    status: 'completed',
    revenue: input.revenue,
    tip: input.tip,
  })

  const record = await pb().collection('jobs').create<PbRecord>(payload)
  return pbJobToApp(record)
}

export async function updateJob(id: string, updates: JobEditData): Promise<Job | null> {
  try {
    const current = await pb().collection('jobs').getOne<PbRecord>(id, { expand: 'package_id' })
    const currentJob = pbJobToApp(current)
    const pkg = current.expand?.package_id ? pbPackageToApp(current.expand.package_id) : undefined
    const completing = isCompletingJob(currentJob.status, updates.status)

    const payload = appJobEditToPb(updates) as Record<string, unknown>

    if (completing) {
      const { getSupplies, deductSupplies } = await import('./supplies-pocketbase')
      const catalog = await getSupplies()
      const suppliesUsed = resolveSuppliesUsed(currentJob, pkg, updates.supplies_used)
      const supplyLine = buildSupplyExpenseLine(suppliesUsed, catalog)
      payload.supplies_used = suppliesUsed
      payload.expenses = mergeSupplyExpense(currentJob.expenses, supplyLine)
      await deductSupplies(suppliesUsed)
    }

    const record = await pb().collection('jobs').update<PbRecord>(id, payload)
    return pbJobToApp(record)
  } catch {
    return null
  }
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  const [clients, jobs] = await Promise.all([getClients(), fetchJobsRaw()])
  return clients
    .map((client) => {
      const clientJobs = jobs.filter((j) => j.client_id === client.id)
      const totalRevenue = clientJobs.reduce((s, j) => s + j.revenue + j.tip, 0)
      return { ...client, totalRevenue, jobCount: clientJobs.length }
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export async function getClientJobs(clientId: string): Promise<JobWithRelations[]> {
  const escaped = escapeFilterValue(clientId)
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    filter: `client_id = "${escaped}"`,
    sort: '-date',
    expand: JOB_EXPAND,
  })
  return records.map(pbJobToAppWithRelations)
}

export async function getDashboardData(): Promise<{
  kpis: DashboardKpis
  recentJobs: RecentJobRow[]
  jobsToday: number
}> {
  const [jobs, invoices] = await Promise.all([fetchJobsExpanded(), fetchInvoices()])
  return computeDashboard(jobs, invoices)
}

export async function getWeekDays(): Promise<WeekDay[]> {
  const jobs = await fetchJobsRaw()
  return computeWeekDays(jobs)
}

export async function getJobsForDate(date: string): Promise<RecentJobRow[]> {
  const escaped = escapeFilterValue(date)
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    filter: `date = "${escaped}"`,
    expand: JOB_EXPAND,
  })
  return computeJobsForDate(records.map(pbJobToAppWithRelations), date)
}

export async function getPLReport(range: DateRangeKey) {
  const [jobs, overhead] = await Promise.all([fetchJobsRaw(), overheadPb.getOverheadForRange(range)])
  return computePLReport(jobs, range, overhead)
}

export async function getPLReportBundle(range: DateRangeKey) {
  const [jobs, expenses] = await Promise.all([fetchJobsRaw(), overheadPb.getOverheadExpenses()])
  const { start, end } = rangeFor(range)
  const prior = priorRangeFor(range)
  const currentOverhead = overheadAmountForDates(expenses, start, end)
  const priorOverhead = overheadAmountForDates(expenses, prior.start, prior.end)
  return {
    current: computePLReportForDates(jobs, start, end, currentOverhead),
    prior: computePLReportForDates(jobs, prior.start, prior.end, priorOverhead),
  }
}

export async function exportJobsCSV(range: DateRangeKey): Promise<string> {
  const [jobs, clients, packages] = await Promise.all([
    fetchJobsRaw(),
    getClients(),
    getPackages(),
  ])
  return computeJobsCSV(jobs, range, (job) => ({
    client: clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: packages.find((p) => p.id === job.package_id)?.name ?? '',
  }))
}

const DEFAULT_PACKAGES = [
  { name: 'Basic Wash', base_price: 80, active: true, description: 'Exterior wash and dry' },
  { name: 'Full Detail', base_price: 320, active: true, description: 'Interior + exterior full detail' },
  { name: 'Paint Correct', base_price: 450, active: true, description: 'Single-stage paint correction' },
  { name: 'Ceramic Coat', base_price: 800, active: true, description: 'Ceramic coating application' },
]

/** Ensure default service packages exist — only when collection is empty and auth works. */
export async function seedPackagesIfEmpty(): Promise<number> {
  if (!(await ensurePocketBaseAuth())) return 0

  const client = pb()
  const { totalItems } = await client.collection('packages').getList(1, 1)
  if (totalItems > 0) return 0

  let created = 0
  for (const pkg of DEFAULT_PACKAGES) {
    try {
      await client.collection('packages').create(pkg)
      created++
    } catch {
      // Unauthenticated or validation failure — stop rather than spam the console
      break
    }
  }
  return created
}

export async function getCollectionCounts(): Promise<Record<string, number>> {
  const collections = ['packages', 'clients', 'jobs', 'invoices'] as const
  const counts: Record<string, number> = {}
  for (const name of collections) {
    const list = await pb().collection(name).getList(1, 1)
    counts[name] = list.totalItems
  }
  return counts
}
