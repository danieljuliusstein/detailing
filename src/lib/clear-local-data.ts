import { purgeStaleQueueItems } from './api/queue-utils'
import { clearQueue } from './offline-queue'
import { isDemoAppData, isDemoHomeInventory } from './demo-data'
import type { HomeInventoryItem } from './home-inventory'
import { createEmptyData, saveData } from './storage'
import { isPocketBaseConfigured } from './pocketbase'

const APP_DATA_KEY = 'detailing_app_data_v1'
const HOME_INVENTORY_KEY = 'detailing_home_inventory_v1'
const ID_MAP_KEY = 'detailing_pb_id_map_v1'
const MIGRATED_KEY = 'migrated_to_pb_v1'

/** Wipe per-device caches (jobs, clients, inventory). Keeps PIN and settings. */
export async function clearLocalDeviceData(): Promise<void> {
  if (typeof window === 'undefined') return

  localStorage.removeItem(APP_DATA_KEY)
  localStorage.removeItem(HOME_INVENTORY_KEY)
  localStorage.removeItem(ID_MAP_KEY)
  localStorage.removeItem(MIGRATED_KEY)
  saveData(createEmptyData())
  await clearQueue()
}

export async function clearLocalDeviceDataSync(): Promise<void> {
  await clearLocalDeviceData()
  await purgeStaleQueueItems()
}

/** Remove saved demo if present — e.g. phone that seeded before cloud connected. */
export function purgeDemoCacheIfPresent(): boolean {
  if (typeof window === 'undefined') return false
  let purged = false

  const rawApp = localStorage.getItem(APP_DATA_KEY)
  if (rawApp) {
    try {
      const parsed = JSON.parse(rawApp)
      if (!isPocketBaseConfigured() || isDemoAppData(parsed)) {
        localStorage.removeItem(APP_DATA_KEY)
        purged = true
      }
    } catch {
      localStorage.removeItem(APP_DATA_KEY)
      purged = true
    }
  }

  const rawInv = localStorage.getItem(HOME_INVENTORY_KEY)
  if (rawInv) {
    try {
      const items = JSON.parse(rawInv) as HomeInventoryItem[]
      if (!isPocketBaseConfigured() || isDemoHomeInventory(items)) {
        localStorage.removeItem(HOME_INVENTORY_KEY)
        purged = true
      }
    } catch {
      localStorage.removeItem(HOME_INVENTORY_KEY)
      purged = true
    }
  }

  if (purged) {
    void clearQueue()
  }

  return purged
}
