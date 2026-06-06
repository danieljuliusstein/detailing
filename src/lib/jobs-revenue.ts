import { netProfit } from './calculations'
import { rangeFor } from './api/aggregates'
import type { DateRangeKey } from './api/reports'
import type { JobWithRelations } from './types'

export const SERVICE_COLORS: Record<string, string> = {
  'Paint Correct': '#5b9cf6',
  'Ceramic Coat': '#3dc97a',
  'Full Detail': '#f5a623',
  'Basic Wash': '#a78bfa',
}

const FALLBACK_COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#c084fc', '#fb7185']

export interface ServiceSlice {
  label: string
  amount: number
  color: string
}

export interface JobsRevenueStats {
  totalRevenue: number
  totalProfit: number
  jobCount: number
  avgJobValue: number
  margin: number
  services: ServiceSlice[]
}

function jobInRange(job: JobWithRelations, start: Date, end: Date): boolean {
  const d = new Date(job.date + 'T12:00:00')
  return d >= start && d <= end
}

function colorForService(label: string, index: number): string {
  return SERVICE_COLORS[label] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function filterJobsByRange(jobs: JobWithRelations[], range: DateRangeKey): JobWithRelations[] {
  const { start, end } = rangeFor(range)
  return jobs.filter((j) => jobInRange(j, start, end))
}

export function aggregateJobsRevenue(jobs: JobWithRelations[]): JobsRevenueStats {
  const byService = new Map<string, number>()
  let totalRevenue = 0
  let totalProfit = 0

  for (const job of jobs) {
    const amount = job.revenue + job.tip
    const label = job.package?.name?.trim() || 'Other'
    byService.set(label, (byService.get(label) ?? 0) + amount)
    totalRevenue += amount
    totalProfit += netProfit(job)
  }

  const services: ServiceSlice[] = [...byService.entries()]
    .map(([label, amount], index) => ({
      label,
      amount,
      color: colorForService(label, index),
    }))
    .sort((a, b) => b.amount - a.amount)

  const jobCount = jobs.length
  const avgJobValue = jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  return { totalRevenue, totalProfit, jobCount, avgJobValue, margin, services }
}

export function rangePeriodLabel(range: DateRangeKey, now = new Date()): string {
  const { start, end } = rangeFor(range, now)
  switch (range) {
    case 'this_month':
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'last_month':
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'this_year':
      return String(now.getFullYear())
    case 'this_week': {
      const sameMonth = start.getMonth() === end.getMonth()
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const endStr = end.toLocaleDateString('en-US', {
        month: sameMonth ? undefined : 'short',
        day: 'numeric',
      })
      return `${startStr} – ${endStr}`
    }
  }
}

export const FILTER_CHIPS: { key: DateRangeKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'this_week', label: 'This week' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
]

/** SVG donut arc path from startAngle to endAngle (radians). */
export function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  const ox1 = cx + outerR * Math.cos(startAngle)
  const oy1 = cy + outerR * Math.sin(startAngle)
  const ox2 = cx + outerR * Math.cos(endAngle)
  const oy2 = cy + outerR * Math.sin(endAngle)
  const ix2 = cx + innerR * Math.cos(endAngle)
  const iy2 = cy + innerR * Math.sin(endAngle)
  const ix1 = cx + innerR * Math.cos(startAngle)
  const iy1 = cy + innerR * Math.sin(startAngle)

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}
