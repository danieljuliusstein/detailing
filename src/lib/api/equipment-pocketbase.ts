import { getPocketBase } from '../pocketbase'
import { appEquipmentToPb, pbEquipmentToApp, type PbRecord } from './mappers'
import { withOrganization } from './tenant-pocketbase'
import type { Equipment, EquipmentInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getEquipment(): Promise<Equipment[]> {
  const records = await pb().collection('equipment').getFullList<PbRecord>({ sort: 'name' })
  return records.map(pbEquipmentToApp)
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  try {
    const record = await pb().collection('equipment').getOne<PbRecord>(id)
    return pbEquipmentToApp(record)
  } catch {
    return null
  }
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const record = await pb().collection('equipment').create<PbRecord>(
    withOrganization(appEquipmentToPb(input)),
  )
  return pbEquipmentToApp(record)
}

export async function updateEquipment(
  id: string,
  input: Partial<EquipmentInput>
): Promise<Equipment | null> {
  try {
    const current = await getEquipmentItem(id)
    if (!current) return null
    const merged = { ...current, ...input }
    const record = await pb().collection('equipment').update<PbRecord>(id, appEquipmentToPb(merged))
    return pbEquipmentToApp(record)
  } catch {
    return null
  }
}

export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    await pb().collection('equipment').delete(id)
    return true
  } catch {
    return false
  }
}
