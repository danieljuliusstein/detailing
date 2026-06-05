import { authenticatePocketBase } from '../pb-auth'
import { checkPocketBaseHealth, isPocketBaseConfigured } from '../pocketbase'
import {
  getQueueCount,
  getQueueItems,
  incrementRetries,
  removeQueueItem,
  type QueueItem,
} from '../offline-queue'
import * as invPb from './invoices-pocketbase'
import * as overheadPb from './overhead-pocketbase'
import * as photosPb from './photos-pocketbase'
import * as pb from './pocketbase'
import * as suppliesPb from './supplies-pocketbase'
import {
  clearMigratedFlag,
  getMigrationStatus,
  isMigrated,
  migrateLocalToPocketBase,
  type MigrationResult,
} from './migrate'

export type { MigrationResult, MigrationStatus } from './migrate'
export { getMigrationStatus, isMigrated }

export interface FlushResult {
  processed: number
  failed: number
  remaining: number
  errors: string[]
}

export interface SyncStatus {
  online: boolean
  pocketBaseConfigured: boolean
  pocketBaseHealthy: boolean
  pendingWrites: number
  migrated: boolean
}

/** Maps local IDs → PocketBase IDs built during queue flush */
export class IdMaps {
  jobs = new Map<string, string>()
  supplies = new Map<string, string>()
  overhead = new Map<string, string>()
  invoices = new Map<string, string>()

  resolveJob(id: string): string {
    return this.jobs.get(id) ?? id
  }

  resolveSupply(id: string): string {
    return this.supplies.get(id) ?? id
  }

  resolveOverhead(id: string): string {
    return this.overhead.get(id) ?? id
  }

  resolveInvoice(id: string): string {
    return this.invoices.get(id) ?? id
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

async function processItem(item: QueueItem, maps: IdMaps): Promise<void> {
  const op = item.operation

  switch (op.type) {
    case 'createJob': {
      const job = await pb.createJob(op.params)
      maps.jobs.set(op.localJobId, job.id)
      break
    }
    case 'updateJob': {
      const jobId = maps.resolveJob(op.params.id)
      await pb.updateJob(jobId, op.params.data)
      break
    }
    case 'createInvoiceForJob': {
      const jobId = maps.resolveJob(op.params.jobId)
      const invoice = await invPb.createInvoiceForJob(jobId)
      maps.invoices.set(op.params.jobId, invoice.id)
      break
    }
    case 'markInvoiceSent': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      await invPb.markInvoiceSent(invoiceId)
      break
    }
    case 'addPayment': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      await invPb.addPayment(invoiceId, op.params.payment)
      break
    }
    case 'markInvoicePaid': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      await invPb.markInvoicePaid(invoiceId, op.params.method)
      break
    }
    case 'createSupply': {
      const supply = await suppliesPb.createSupply(op.params)
      maps.supplies.set(op.localSupplyId, supply.id)
      break
    }
    case 'updateSupply': {
      const supplyId = maps.resolveSupply(op.params.id)
      await suppliesPb.updateSupply(supplyId, op.params.input)
      break
    }
    case 'restockSupply': {
      const supplyId = maps.resolveSupply(op.params.id)
      await suppliesPb.updateSupplyQty(supplyId, op.params.quantity)
      break
    }
    case 'createOverheadExpense': {
      const expense = await overheadPb.createOverheadExpense(op.params)
      maps.overhead.set(op.localOverheadId, expense.id)
      break
    }
    case 'updateOverheadExpense': {
      const expenseId = maps.resolveOverhead(op.params.id)
      await overheadPb.updateOverheadExpense(expenseId, op.params.input)
      break
    }
    case 'deleteOverheadExpense': {
      const expenseId = maps.resolveOverhead(op.params.id)
      await overheadPb.deleteOverheadExpense(expenseId)
      break
    }
    case 'uploadJobPhoto': {
      const jobId = maps.resolveJob(op.params.jobId)
      const file = dataUrlToFile(op.params.dataUrl, op.params.filename)
      await photosPb.uploadJobPhoto(jobId, file, op.params.photoType)
      break
    }
    case 'deleteJobPhoto': {
      const jobId = maps.resolveJob(op.params.jobId)
      await photosPb.deleteJobPhoto(jobId, op.params.filename)
      break
    }
  }
}

export async function flushOfflineQueue(): Promise<FlushResult> {
  const result: FlushResult = { processed: 0, failed: 0, remaining: 0, errors: [] }

  if (!isPocketBaseConfigured()) return result

  const healthy = await checkPocketBaseHealth()
  if (!healthy) {
    result.remaining = await getQueueCount()
    return result
  }

  if (!(await authenticatePocketBase())) {
    result.remaining = await getQueueCount()
    result.errors.push('PocketBase authentication failed')
    return result
  }

  const items = await getQueueItems()
  const maps = new IdMaps()

  for (const item of items) {
    try {
      await processItem(item, maps)
      await removeQueueItem(item.id)
      result.processed++
    } catch (err) {
      await incrementRetries(item.id)
      result.failed++
      result.errors.push(err instanceof Error ? err.message : String(err))
      if (item.retries >= 3) {
        result.errors.push(`Giving up on ${item.id} after 3 retries`)
      }
    }
  }

  result.remaining = await getQueueCount()
  return result
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  const pocketBaseConfigured = isPocketBaseConfigured()
  const pocketBaseHealthy = pocketBaseConfigured && online ? await checkPocketBaseHealth() : false
  const pendingWrites = typeof indexedDB !== 'undefined' ? await getQueueCount() : 0

  return {
    online,
    pocketBaseConfigured,
    pocketBaseHealthy,
    pendingWrites,
    migrated: isMigrated(),
  }
}

export async function runDataMigration(options?: { force?: boolean }): Promise<MigrationResult> {
  if (options?.force) {
    const counts = await pb.getCollectionCounts()
    if (counts.jobs > 0) {
      throw new Error('PocketBase already has jobs — cannot force migration')
    }
    clearMigratedFlag()
  }

  if (!isPocketBaseConfigured()) {
    throw new Error('PocketBase is not configured')
  }

  const healthy = await checkPocketBaseHealth()
  if (!healthy) throw new Error('PocketBase is unreachable')

  if (!(await authenticatePocketBase())) {
    throw new Error('PocketBase authentication failed')
  }

  return migrateLocalToPocketBase()
}

export async function syncOnReconnect(): Promise<FlushResult> {
  const flush = await flushOfflineQueue()
  if (flush.processed > 0 && !isMigrated()) {
    try {
      await migrateLocalToPocketBase()
    } catch {
      // migration may already be done
    }
  }
  return flush
}
