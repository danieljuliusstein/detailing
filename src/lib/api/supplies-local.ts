import { isLowStock } from '../supplies-logic'
import { loadData, newId, saveData } from '../storage'
import type { Supply, SupplyInput } from '../types'

export function getSupplies(): Supply[] {
  return loadData().supplies
}

export function getSupply(id: string): Supply | null {
  return loadData().supplies.find((s) => s.id === id) ?? null
}

export function getLowInventorySupplies(): Supply[] {
  return getSupplies().filter(isLowStock)
}

export function createSupply(input: SupplyInput): Supply {
  const data = loadData()
  const supply: Supply = { id: newId(), ...input }
  data.supplies.push(supply)
  saveData(data)
  return supply
}

export function updateSupply(id: string, input: Partial<SupplyInput>): Supply | null {
  const data = loadData()
  const idx = data.supplies.findIndex((s) => s.id === id)
  if (idx === -1) return null
  data.supplies[idx] = { ...data.supplies[idx], ...input }
  saveData(data)
  return data.supplies[idx]
}

export function deleteSupply(id: string): boolean {
  const data = loadData()
  const before = data.supplies.length
  data.supplies = data.supplies.filter((s) => s.id !== id)
  if (data.supplies.length === before) return false
  saveData(data)
  return true
}

export function updateSupplyQty(id: string, delta: number): Supply | null {
  const data = loadData()
  const idx = data.supplies.findIndex((s) => s.id === id)
  if (idx === -1) return null
  data.supplies[idx] = {
    ...data.supplies[idx],
    quantity_on_hand: Math.max(0, data.supplies[idx].quantity_on_hand + delta),
  }
  saveData(data)
  return data.supplies[idx]
}

export function saveSuppliesCatalog(catalog: Supply[]): void {
  const data = loadData()
  data.supplies = catalog
  saveData(data)
}
