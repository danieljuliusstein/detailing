import { clearLocalDeviceDataSync, purgeDemoCacheIfPresent } from '../clear-local-data'
import { purgeStaleQueueItems } from './queue-utils'
import { ensurePocketBaseAuth } from '../pb-auth'
import { ensureDefaultCatalog } from './catalog-ready'
import { checkPocketBaseHealth, isPocketBaseConfigured } from '../pocketbase'
import { withTimeout } from '../timeout'
import { migrateLocalToPocketBase } from './migrate'
import * as invLocal from './invoices-local'
import * as invPb from './invoices-pocketbase'
import * as local from './local'
import * as overheadLocal from './overhead-local'
import * as overheadPb from './overhead-pocketbase'
import * as photosLocal from './photos-local'
import * as photosPb from './photos-pocketbase'
import * as pb from './pocketbase'
import { clearQueue } from '../offline-queue'
import {
  flushOfflineQueue,
  getMigrationStatus,
  getSyncStatus,
  runDataMigration,
  syncOnReconnect,
  type FlushResult,
  type MigrationResult,
  type MigrationStatus,
  type SyncStatus,
} from './sync'
import * as suppliesLocal from './supplies-local'
import * as suppliesPb from './supplies-pocketbase'
import { clearWriteDegraded, executeWrite } from './write-router'
import {
  getPLReportFromJobs,
  getPLReportBundleFromJobs,
  exportJobsCSVFromJobs,
  type DateRangeKey,
  type PLReportBundle,
} from './reports'
import type {
  Client,
  ClientInput,
  ClientWithStats,
  DashboardKpis,
  Invoice,
  Job,
  JobEditData,
  JobPhoto,
  JobWithRelations,
  OverheadExpense,
  OverheadInput,
  Package,
  PackageInput,
  Payment,
  PhotoType,
  QuickJobData,
  RecentJobRow,
  Supply,
  SupplyInput,
  WeekDay,
} from '../types'

export type { DateRangeKey, PLReport } from './reports'
export type { FlushResult, MigrationResult, MigrationStatus, SyncStatus }
export { getMigrationStatus, getSyncStatus, runDataMigration, flushOfflineQueue, syncOnReconnect }
export { clearLocalDeviceDataSync as clearLocalDeviceData, purgeDemoCacheIfPresent }

let backend: 'local' | 'pocketbase' | null = null
let initPromise: Promise<'local' | 'pocketbase'> | null = null

async function resolveBackend(): Promise<'local' | 'pocketbase'> {
  if (backend) return backend

  if (!initPromise) {
    initPromise = initBackend()
  }
  return initPromise
}

async function initBackendInner(): Promise<'local' | 'pocketbase'> {
  purgeDemoCacheIfPresent()
  await purgeStaleQueueItems()

  if (!isPocketBaseConfigured()) {
    return 'local'
  }

  const healthy = await checkPocketBaseHealth()
  if (!healthy) {
    return 'local'
  }

  if (!(await ensurePocketBaseAuth())) {
    return 'local'
  }

  clearWriteDegraded()
  purgeDemoCacheIfPresent()
  const { loadSettingsAsync } = await import('../settings')
  await loadSettingsAsync()

  // Non-blocking — keeps mobile connect fast on slow networks
  void (async () => {
    try {
      await ensurePocketBaseAuth()
      await ensureDefaultCatalog()
    } catch {
      // catalog check is best-effort on connect
    }
    try {
      await migrateLocalToPocketBase()
    } catch (err) {
      console.warn('[api] Local data migration failed:', err)
    }
    try {
      await flushOfflineQueue()
    } catch (err) {
      console.warn('[api] Offline queue flush failed:', err)
    }
  })()

  return 'pocketbase'
}

async function initBackend(): Promise<'local' | 'pocketbase'> {
  try {
    backend = await withTimeout(initBackendInner(), 25_000, 'Backend init')
  } catch (err) {
    console.warn('[api] PocketBase init failed, using local storage:', err)
    backend = 'local'
  }
  return backend
}

/** Force re-resolve on next request (e.g. after reconnect) */
export function resetBackend(): void {
  backend = null
  initPromise = null
}

export async function getPackages(): Promise<Package[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getPackages() : local.getPackages()
}

export async function getAllPackages(): Promise<Package[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getAllPackages() : local.getAllPackages()
}

export async function createPackage(input: PackageInput): Promise<Package> {
  return (await resolveBackend()) === 'pocketbase' ? pb.createPackage(input) : local.createPackage(input)
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.updatePackage(id, input) : local.updatePackage(id, input)
}

export async function getClients(): Promise<Client[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClients() : local.getClients()
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClientsWithStats() : local.getClientsWithStats()
}

export async function getClient(id: string): Promise<Client | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClient(id) : local.getClient(id)
}

export async function createClient(input: ClientInput): Promise<Client> {
  return (await resolveBackend()) === 'pocketbase' ? pb.createClient(input) : local.createClient(input)
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.updateClient(id, input) : local.updateClient(id, input)
}

export async function getClientJobs(clientId: string): Promise<JobWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClientJobs(clientId) : local.getClientJobs(clientId)
}

export async function getRecentClients(limit = 10): Promise<Client[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getRecentClients(limit) : local.getRecentClients(limit)
}

export async function getJobs(): Promise<JobWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJobs() : local.getJobs()
}

export async function getJob(id: string): Promise<JobWithRelations | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJob(id) : local.getJob(id)
}

export async function createJob(data: QuickJobData): Promise<Job> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => local.createJob(data),
    pocketbase: () => pb.createJob(data),
    buildQueue: (job) => ({ type: 'createJob', params: data, localJobId: job.id }),
  })
}

export async function updateJob(id: string, data: JobEditData): Promise<Job | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => local.updateJob(id, data),
    pocketbase: () => pb.updateJob(id, data),
    buildQueue: (job) => (job ? { type: 'updateJob', params: { id, data } } : null),
  })
}

export async function getDashboardData(): Promise<{
  kpis: DashboardKpis
  recentJobs: RecentJobRow[]
  jobsToday: number
  weekDays: WeekDay[]
}> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') {
    const [base, weekDays] = await Promise.all([pb.getDashboardData(), pb.getWeekDays()])
    return { ...base, weekDays }
  }
  return { ...local.getDashboardData(), weekDays: local.getWeekDays() }
}

export async function getJobsForDate(date: string): Promise<RecentJobRow[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJobsForDate(date) : local.getJobsForDate(date)
}

export async function findOrCreateClient(name: string, existingId: string | null): Promise<Client> {
  return (await resolveBackend()) === 'pocketbase'
    ? pb.findOrCreateClient(name, existingId)
    : local.findOrCreateClient(name, existingId)
}

export async function getPLReport(range: DateRangeKey) {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.getPLReport(range)
  return getPLReportFromJobs(local.getJobsRaw(), range)
}

export async function getPLReportBundle(range: DateRangeKey): Promise<PLReportBundle> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.getPLReportBundle(range)
  return getPLReportBundleFromJobs(local.getJobsRaw(), range)
}

export async function exportJobsCSV(range: DateRangeKey): Promise<string> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.exportJobsCSV(range)
  return exportJobsCSVFromJobs(local.getJobsRaw(), range)
}

export async function getActiveBackend(): Promise<'local' | 'pocketbase'> {
  return resolveBackend()
}

export async function createInvoiceForJob(jobId: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.createInvoiceForJob(jobId),
    pocketbase: () => invPb.createInvoiceForJob(jobId),
    buildQueue: (invoice) => ({ type: 'createInvoiceForJob', params: { jobId } }),
  })
}

export async function getInvoices(): Promise<Invoice[]> {
  return (await resolveBackend()) === 'pocketbase' ? invPb.getInvoices() : invLocal.getInvoices()
}

export async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  return (await resolveBackend()) === 'pocketbase'
    ? invPb.getInvoiceByJobId(jobId)
    : invLocal.getInvoiceByJobId(jobId)
}

export async function clearOfflineQueue(): Promise<void> {
  await clearQueue()
}

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.markInvoiceSent(invoiceId),
    pocketbase: () => invPb.markInvoiceSent(invoiceId),
    buildQueue: () => ({ type: 'markInvoiceSent', params: { invoiceId } }),
  })
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.addPayment(invoiceId, payment),
    pocketbase: () => invPb.addPayment(invoiceId, payment),
    buildQueue: () => ({ type: 'addPayment', params: { invoiceId, payment } }),
  })
}

export async function markInvoicePaid(invoiceId: string, method: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.markInvoicePaid(invoiceId, method),
    pocketbase: () => invPb.markInvoicePaid(invoiceId, method),
    buildQueue: () => ({ type: 'markInvoicePaid', params: { invoiceId, method } }),
  })
}

export async function getSupplies(): Promise<Supply[]> {
  return (await resolveBackend()) === 'pocketbase' ? suppliesPb.getSupplies() : suppliesLocal.getSupplies()
}

export async function getSupply(id: string): Promise<Supply | null> {
  return (await resolveBackend()) === 'pocketbase' ? suppliesPb.getSupply(id) : suppliesLocal.getSupply(id)
}

export async function getLowInventorySupplies(): Promise<Supply[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? suppliesPb.getLowInventorySupplies()
    : suppliesLocal.getLowInventorySupplies()
}

export async function createSupply(input: SupplyInput): Promise<Supply> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.createSupply(input),
    pocketbase: () => suppliesPb.createSupply(input),
    buildQueue: (supply) => ({ type: 'createSupply', params: input, localSupplyId: supply.id }),
  })
}

export async function updateSupply(id: string, input: Partial<SupplyInput>): Promise<Supply | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.updateSupply(id, input),
    pocketbase: () => suppliesPb.updateSupply(id, input),
    buildQueue: (supply) => (supply ? { type: 'updateSupply', params: { id, input } } : null),
  })
}

export async function deleteSupply(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') {
    try {
      return await suppliesPb.deleteSupply(id)
    } catch {
      return suppliesLocal.deleteSupply(id)
    }
  }
  return suppliesLocal.deleteSupply(id)
}

export async function restockSupply(id: string, quantity: number): Promise<Supply | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.updateSupplyQty(id, quantity),
    pocketbase: () => suppliesPb.updateSupplyQty(id, quantity),
    buildQueue: (supply) => (supply ? { type: 'restockSupply', params: { id, quantity } } : null),
  })
}

export async function getOverheadExpenses(): Promise<OverheadExpense[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? overheadPb.getOverheadExpenses()
    : overheadLocal.getOverheadExpenses()
}

export async function createOverheadExpense(input: OverheadInput): Promise<OverheadExpense> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.createOverheadExpense(input),
    pocketbase: () => overheadPb.createOverheadExpense(input),
    buildQueue: (expense) => ({ type: 'createOverheadExpense', params: input, localOverheadId: expense.id }),
  })
}

export async function updateOverheadExpense(
  id: string,
  input: Partial<OverheadInput>
): Promise<OverheadExpense | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.updateOverheadExpense(id, input),
    pocketbase: () => overheadPb.updateOverheadExpense(id, input),
    buildQueue: (expense) => (expense ? { type: 'updateOverheadExpense', params: { id, input } } : null),
  })
}

export async function deleteOverheadExpense(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.deleteOverheadExpense(id),
    pocketbase: () => overheadPb.deleteOverheadExpense(id),
    buildQueue: () => ({ type: 'deleteOverheadExpense', params: { id } }),
  })
}

export async function getMonthlyOverheadTotal(): Promise<number> {
  return (await resolveBackend()) === 'pocketbase'
    ? overheadPb.getMonthlyOverheadTotal()
    : overheadLocal.getMonthlyOverheadTotal()
}

export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? photosPb.getJobPhotos(jobId)
    : photosLocal.getJobPhotos(jobId)
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadJobPhoto(jobId: string, file: File, type: PhotoType): Promise<JobPhoto> {
  const resolved = await resolveBackend()
  const dataUrlPromise = readFileAsDataUrl(file)
  return executeWrite({
    resolvedBackend: resolved,
    local: () => photosLocal.uploadJobPhoto(jobId, file, type),
    pocketbase: () => photosPb.uploadJobPhoto(jobId, file, type),
    buildQueue: async (photo) => ({
      type: 'uploadJobPhoto',
      params: {
        jobId,
        dataUrl: await dataUrlPromise,
        photoType: type,
        filename: photo.filename,
      },
    }),
  })
}

export async function deleteJobPhoto(jobId: string, filename: string): Promise<void> {
  const resolved = await resolveBackend()
  await executeWrite({
    resolvedBackend: resolved,
    local: () => { photosLocal.deleteJobPhoto(jobId, filename) },
    pocketbase: async () => { await photosPb.deleteJobPhoto(jobId, filename) },
    buildQueue: () => ({ type: 'deleteJobPhoto', params: { jobId, filename } }),
  })
}
