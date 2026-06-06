import type { PLReport } from './api/aggregates'
import type { DateRangeKey } from './api/reports'

export const MARGIN_TARGET_PCT = 55

export const EXPENSE_ORDER: (keyof PLReport['expenses'])[] = [
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'overhead',
  'other',
]

export const EXPENSE_LABELS: Record<keyof PLReport['expenses'], string> = {
  supplies: 'Supplies',
  travel: 'Travel',
  equipment: 'Equipment',
  marketing: 'Marketing',
  labor: 'Labor',
  overhead: 'Overhead',
  other: 'Other',
}

export const REPORT_FILTER_CHIPS: { key: DateRangeKey; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
]

export function plProgressPeriodLabel(range: DateRangeKey): string {
  switch (range) {
    case 'this_week':
      return 'THIS WEEK'
    case 'this_month':
      return 'THIS MONTH'
    case 'last_month':
      return 'LAST MONTH'
    case 'this_year':
      return 'THIS YEAR'
  }
}

export interface PLProgressBar {
  name: string
  value: number
  color: string
  highlight: boolean
  isExpense: boolean
  isProfit?: boolean
}

export function revenuePct(value: number, revenue: number): number {
  if (revenue <= 0) return 0
  return Math.round((value / revenue) * 100)
}

export function buildPLProgressBars(report: PLReport): {
  revenue: number
  expenseBars: PLProgressBar[]
  profitBar: PLProgressBar
} {
  const { revenue, expenses, netProfit } = report

  const expenseBars: PLProgressBar[] = EXPENSE_ORDER.map((key) => ({
    name: EXPENSE_LABELS[key],
    value: expenses[key],
    color: '#e06060',
    highlight: false,
    isExpense: true,
  })).filter((bar) => bar.value > 0)

  return {
    revenue,
    expenseBars,
    profitBar: {
      name: 'Net profit',
      value: netProfit,
      color: '#3dc97a',
      highlight: true,
      isExpense: false,
      isProfit: true,
    },
  }
}

export interface ReportDeltas {
  revenuePct: number
  profitPct: number
  expenseDollar: number
  marginPct: number
}

/** Each bar is [bottom, top] on the y-axis. vals are positive heights for tooltips. */
export interface WaterfallData {
  ranges: [number, number][]
  starts: number[]
  vals: number[]
  colors: string[]
  labels: string[]
  yMax: number
}

export function percentChange(current: number, prior: number): number {
  if (prior === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prior) / prior) * 100)
}

export function dollarChange(current: number, prior: number): number {
  return Math.round(current - prior)
}

export function computeDeltas(current: PLReport, prior: PLReport): ReportDeltas {
  return {
    revenuePct: percentChange(current.revenue, prior.revenue),
    profitPct: percentChange(current.netProfit, prior.netProfit),
    expenseDollar: dollarChange(current.totalExpenses, prior.totalExpenses),
    marginPct: percentChange(current.marginPct, prior.marginPct),
  }
}

function priorPeriodLabel(range: DateRangeKey): string {
  if (range === 'this_week') return 'last wk.'
  if (range === 'this_year') return 'last yr.'
  return 'last mo.'
}

export function formatDelta(val: number, type: 'percent' | 'dollar', range: DateRangeKey): string {
  const arrow = val >= 0 ? '↑' : '↓'
  const period = priorPeriodLabel(range)
  if (type === 'percent') return `${arrow} ${Math.abs(val)}% vs ${period}`
  return `${arrow} $${Math.abs(val).toLocaleString()} vs ${period}`
}

export function deltaClass(
  val: number,
  kind: 'revenue' | 'profit' | 'expense' | 'margin'
): 'reports-delta--pos' | 'reports-delta--neg' | 'reports-delta--neutral' {
  if (kind === 'expense') return val > 0 ? 'reports-delta--neg' : val < 0 ? 'reports-delta--pos' : 'reports-delta--neutral'
  return val >= 0 ? 'reports-delta--pos' : 'reports-delta--neg'
}

/** Job-level expenses grouped for waterfall (everything except overhead). */
const WATERFALL_OTHER_KEYS: (keyof PLReport['expenses'])[] = [
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'other',
]

/**
 * Waterfall uses grouped bars so small expenses stay visible at chart scale:
 * Revenue → Other exp. (supplies + travel + …) → Overhead → Profit
 */
export function buildWaterfallData(report: PLReport): WaterfallData {
  const { revenue, expenses } = report
  const ranges: [number, number][] = [[0, revenue]]
  const starts: number[] = [0]
  const vals: number[] = [revenue]
  const colors: string[] = ['#3dc97a']
  const labels: string[] = ['Revenue']

  const otherExpenses = WATERFALL_OTHER_KEYS.reduce((sum, key) => sum + expenses[key], 0)
  const overhead = expenses.overhead

  let running = revenue

  if (otherExpenses > 0) {
    const afterOther = running - otherExpenses
    starts.push(afterOther)
    vals.push(otherExpenses)
    ranges.push([afterOther, running])
    colors.push('#e06060')
    labels.push('Other exp.')
    running = afterOther
  }

  if (overhead > 0) {
    const afterOver = running - overhead
    starts.push(afterOver)
    vals.push(overhead)
    ranges.push([afterOver, running])
    colors.push('#e06060')
    labels.push('Overhead')
    running = afterOver
  }

  const profit = running
  starts.push(0)
  vals.push(profit)
  ranges.push([0, profit])
  colors.push('#3dc97a')
  labels.push('Profit')

  const peak = Math.max(revenue, ...ranges.map(([, top]) => top))
  const yMax = peak > 0 ? Math.ceil((peak * 1.1) / 100) * 100 : 100

  return { ranges, starts, vals, colors, labels, yMax }
}
