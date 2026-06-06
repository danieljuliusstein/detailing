import type {
  ExpenseLine,
  Job,
  JobStatus,
  OverheadExpense,
  Package,
  Supply,
  SupplyUsage,
} from './types'
import type { DateRangeKey } from './api/reports'
import { rangeFor } from './api/aggregates'

const COMPLETED_STATUSES: JobStatus[] = ['completed', 'invoiced', 'paid']

export function isCompletedStatus(status: JobStatus): boolean {
  return COMPLETED_STATUSES.includes(status)
}

export function weightedAverageCostPerUnit(
  currentQty: number,
  currentCostPerUnit: number | undefined,
  addQty: number,
  purchaseTotal: number
): number {
  if (addQty <= 0) return currentCostPerUnit ?? 0
  const purchaseCostPerUnit = purchaseTotal / addQty
  if (currentQty <= 0 || currentCostPerUnit == null || currentCostPerUnit <= 0) {
    return Math.round(purchaseCostPerUnit * 10000) / 10000
  }
  const blended = (currentQty * currentCostPerUnit + purchaseTotal) / (currentQty + addQty)
  return Math.round(blended * 10000) / 10000
}

export function costPerUnitFromPurchase(quantity: number, totalCost: number): number {
  if (quantity <= 0 || totalCost <= 0) return 0
  return Math.round((totalCost / quantity) * 10000) / 10000
}

export function filterSuppliesByKind(supplies: Supply[], kind: Supply['kind']): Supply[] {
  return supplies.filter((s) => (s.kind ?? 'other') === kind)
}

export function inventoryDeltaFromUsageChange(
  oldUsed: SupplyUsage[],
  newUsed: SupplyUsage[]
): SupplyUsage[] {
  const map = new Map<string, number>()
  for (const u of newUsed) map.set(u.supply_id, (map.get(u.supply_id) ?? 0) + u.quantity_used)
  for (const u of oldUsed) map.set(u.supply_id, (map.get(u.supply_id) ?? 0) - u.quantity_used)
  return [...map.entries()]
    .filter(([, delta]) => delta !== 0)
    .map(([supply_id, quantity_used]) => ({ supply_id, quantity_used }))
}

export function applySupplyExpenses(
  suppliesUsed: SupplyUsage[],
  catalog: Supply[],
  existingExpenses: ExpenseLine[] = []
): { supplies_used: SupplyUsage[]; expenses: ExpenseLine[] } {
  const supplyLine = buildSupplyExpenseLine(suppliesUsed, catalog)
  return {
    supplies_used: suppliesUsed,
    expenses: mergeSupplyExpense(existingExpenses, supplyLine),
  }
}

export function isCompletingJob(oldStatus: JobStatus, newStatus: JobStatus): boolean {
  return !COMPLETED_STATUSES.includes(oldStatus) && COMPLETED_STATUSES.includes(newStatus)
}

export function defaultSuppliesFromPackage(pkg: Package | undefined): SupplyUsage[] {
  if (!pkg?.default_supplies?.length) return []
  return pkg.default_supplies.map((d) => ({
    supply_id: d.supply_id,
    quantity_used: d.default_qty,
  }))
}

export function buildSupplyExpenseLine(
  suppliesUsed: SupplyUsage[],
  catalog: Supply[]
): ExpenseLine | null {
  let total = 0
  const parts: string[] = []

  for (const usage of suppliesUsed) {
    const supply = catalog.find((s) => s.id === usage.supply_id)
    if (!supply?.cost_per_unit) continue
    const cost = supply.cost_per_unit * usage.quantity_used
    total += cost
    parts.push(`${supply.name} (${usage.quantity_used} ${supply.unit})`)
  }

  if (total <= 0) return null
  return {
    category: 'supplies',
    description: parts.join(', '),
    amount: Math.round(total * 100) / 100,
  }
}

export function mergeSupplyExpense(
  expenses: ExpenseLine[],
  supplyLine: ExpenseLine | null
): ExpenseLine[] {
  const withoutSupplies = expenses.filter((e) => e.category !== 'supplies')
  if (!supplyLine) return withoutSupplies
  return [...withoutSupplies, supplyLine]
}

export function applyInventoryDeduction(
  catalog: Supply[],
  suppliesUsed: SupplyUsage[]
): Supply[] {
  return catalog.map((supply) => {
    const usage = suppliesUsed.find((u) => u.supply_id === supply.id)
    if (!usage) return supply
    return {
      ...supply,
      quantity_on_hand: Math.max(0, supply.quantity_on_hand - usage.quantity_used),
    }
  })
}

export function isLowStock(supply: Supply): boolean {
  if (supply.reorder_threshold == null) return false
  return supply.quantity_on_hand <= supply.reorder_threshold
}

function daysInRange(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1)
}

function monthsInRange(start: Date, end: Date): number {
  const startMonth = start.getFullYear() * 12 + start.getMonth()
  const endMonth = end.getFullYear() * 12 + end.getMonth()
  return Math.max(1, endMonth - startMonth + 1)
}

export function overheadAmountForDates(expenses: OverheadExpense[], start: Date, end: Date): number {
  let total = 0

  for (const exp of expenses) {
    const cycle = exp.billing_cycle ?? 'monthly'
    switch (cycle) {
      case 'monthly':
        total += exp.amount * monthsInRange(start, end)
        break
      case 'annual': {
        const days = daysInRange(start, end)
        total += (exp.amount / 365) * days
        break
      }
      case 'one_time': {
        if (!exp.next_due) break
        const due = new Date(exp.next_due + 'T12:00:00')
        if (due >= start && due <= end) total += exp.amount
        break
      }
    }
  }

  return Math.round(total * 100) / 100
}

export function overheadAmountForRange(
  expenses: OverheadExpense[],
  range: DateRangeKey,
  now = new Date()
): number {
  const { start, end } = rangeFor(range, now)
  return overheadAmountForDates(expenses, start, end)
}

export function resolveSuppliesUsed(
  job: Pick<Job, 'supplies_used'>,
  pkg: Package | undefined,
  explicit?: SupplyUsage[]
): SupplyUsage[] {
  if (explicit?.length) return explicit
  if (job.supplies_used.length) return job.supplies_used
  return defaultSuppliesFromPackage(pkg)
}
