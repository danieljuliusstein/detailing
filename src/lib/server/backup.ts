import { authenticateServerPocketBase } from './pocketbase-admin'

const COLLECTIONS = [
  'packages',
  'clients',
  'jobs',
  'invoices',
  'supplies',
  'overhead_expenses',
  'app_settings',
  'notifications_log',
] as const

export interface BackupPayload {
  exported_at: string
  version: 1
  collections: Record<string, unknown[]>
}

export async function createPocketBaseBackup(): Promise<BackupPayload> {
  const pb = await authenticateServerPocketBase()
  const collections: Record<string, unknown[]> = {}

  for (const name of COLLECTIONS) {
    try {
      collections[name] = await pb.collection(name).getFullList({ sort: '-id' })
    } catch {
      collections[name] = []
    }
  }

  const payload: BackupPayload = {
    exported_at: new Date().toISOString(),
    version: 1,
    collections,
  }

  await updateLastBackupAt(pb)

  return payload
}

async function updateLastBackupAt(pb: Awaited<ReturnType<typeof authenticateServerPocketBase>>) {
  try {
    const records = await pb.collection('app_settings').getFullList({ limit: 1 })
    const now = new Date().toISOString().slice(0, 10)
    if (records.length > 0) {
      await pb.collection('app_settings').update(records[0].id, { last_backup_at: now })
    } else {
      await pb.collection('app_settings').create({
        business_name: 'Detailing',
        last_backup_at: now,
        notifications: {},
      })
    }
  } catch {
    // app_settings may not exist yet
  }
}
