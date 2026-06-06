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
  job: Job,
  pkg: Package | undefined,
  explicit?: SupplyUsage[]
): SupplyUsage[] {
  if (explicit?.length) return explicit
  if (job.supplies_used.length) return job.supplies_used
  return defaultSuppliesFromPackage(pkg)
}
