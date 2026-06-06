import { ensurePocketBaseAuth } from '../pb-auth'
import { getPocketBase } from '../pocketbase'
import * as pb from './pocketbase'
import * as suppliesPb from './supplies-pocketbase'

const CATALOG_OK_KEY = 'pb_catalog_ready_v1'

export function isCatalogMarkedReady(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(CATALOG_OK_KEY) === '1'
}

export function markCatalogReady(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATALOG_OK_KEY, '1')
  }
}

/** On connect: mark catalog ready if PocketBase already has data — never seed. */
export async function syncCatalogReadyFlag(): Promise<void> {
  if (isCatalogMarkedReady()) return
  if (!(await ensurePocketBaseAuth())) return

  const client = getPocketBase()
  if (!client) return

  try {
    const [packages, supplies] = await Promise.all([
      client.collection('packages').getList(1, 1),
      client.collection('supplies').getList(1, 1),
    ])
    if (packages.totalItems > 0 && supplies.totalItems > 0) {
      markCatalogReady()
    }
  } catch {
    // best-effort on connect
  }
}

/** Seed defaults only when authenticated and collections are actually empty (migration). */
export async function ensureDefaultCatalog(): Promise<void> {
  if (isCatalogMarkedReady()) return
  if (!(await ensurePocketBaseAuth())) return

  const client = getPocketBase()
  if (!client) return

  const [packages, supplies] = await Promise.all([
    client.collection('packages').getList(1, 1),
    client.collection('supplies').getList(1, 1),
  ])

  if (packages.totalItems > 0 && supplies.totalItems > 0) {
    markCatalogReady()
    return
  }

  if (packages.totalItems === 0) await pb.seedPackagesIfEmpty()
  if (supplies.totalItems === 0) await suppliesPb.seedSuppliesIfEmpty()

  const [pkgAfter, supAfter] = await Promise.all([
    client.collection('packages').getList(1, 1),
    client.collection('supplies').getList(1, 1),
  ])

  if (pkgAfter.totalItems > 0 && supAfter.totalItems > 0) {
    markCatalogReady()
  }
}
