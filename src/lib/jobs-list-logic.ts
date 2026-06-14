import { mapJobStatusForDisplay } from './calculations'
import type { JobWithRelations } from './types'

export type JobsListFilter = 'all' | 'scheduled' | 'in_progress'

export interface JobListSection {
  key: string
  label: string
  jobs: JobWithRelations[]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function startOfWeek(d = new Date()): Date {
  const s = new Date(d)
  const day = s.getDay()
  s.setDate(s.getDate() - day)
  s.setHours(0, 0, 0, 0)
  return s
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function filterJobsList(jobs: JobWithRelations[], query: string, chip: JobsListFilter): JobWithRelations[] {
  const q = query.trim().toLowerCase()
  return jobs.filter((job) => {
    if (q) {
      const name = job.client?.name?.toLowerCase() ?? ''
      const pkg = job.package?.name?.toLowerCase() ?? ''
      if (!name.includes(q) && !pkg.includes(q)) return false
    }
    if (chip === 'scheduled') return job.status === 'scheduled'
    if (chip === 'in_progress') return job.status === 'in_progress'
    return true
  })
}

export function groupJobsByPeriod(jobs: JobWithRelations[]): JobListSection[] {
  const today = todayStr()
  const weekStart = startOfWeek()
  const monthStart = startOfMonth()
  const sorted = [...jobs].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return (b.start_time ?? '').localeCompare(a.start_time ?? '')
  })

  const todayJobs: JobWithRelations[] = []
  const weekJobs: JobWithRelations[] = []
  const monthJobs: JobWithRelations[] = []

  for (const job of sorted) {
    const d = new Date(job.date + 'T12:00:00')
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (job.date === today) {
      todayJobs.push(job)
    } else if (d >= weekStart && d <= weekEnd) {
      weekJobs.push(job)
    } else if (d >= monthStart && d < weekStart) {
      monthJobs.push(job)
    }
  }

  const sections: JobListSection[] = []
  if (todayJobs.length > 0) {
    const labelDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
    sections.push({ key: 'today', label: `Today · ${labelDate}`, jobs: todayJobs })
  }
  if (weekJobs.length > 0) {
    sections.push({ key: 'week', label: 'This week', jobs: weekJobs })
  }
  if (monthJobs.length > 0) {
    sections.push({ key: 'month', label: 'Earlier this month', jobs: monthJobs })
  }
  return sections
}

export function jobListStatusLabel(job: JobWithRelations): string {
  if (job.status === 'in_progress') return 'In progress'
  const display = mapJobStatusForDisplay(job)
  if (display === 'scheduled') return 'Scheduled'
  if (display === 'paid') return 'Paid'
  if (display === 'invoiced') return 'Invoiced'
  if (display === 'overdue') return 'Awaiting payment'
  return 'Complete'
}

export function jobListStatusClass(job: JobWithRelations): string {
  if (job.status === 'in_progress') return 'badge-status badge-status--blue'
  const display = mapJobStatusForDisplay(job)
  if (display === 'paid' || display === 'completed') return 'badge-status badge-status--green'
  if (display === 'scheduled') return 'badge-status badge-status--amber'
  return 'badge-status badge-status--yellow'
}

export function jobListIconTone(job: JobWithRelations): 'green' | 'amber' | 'blue' | 'gray' {
  if (job.status === 'in_progress') return 'blue'
  const display = mapJobStatusForDisplay(job)
  if (display === 'paid' || display === 'completed') return 'green'
  if (display === 'scheduled') return 'amber'
  return 'gray'
}

export function jobListRightTime(job: JobWithRelations): string {
  const today = todayStr()
  if (job.date === today && job.start_time) {
    const [h, m] = job.start_time.split(':').map(Number)
    if (!Number.isNaN(h)) {
      const dt = new Date()
      dt.setHours(h, m ?? 0)
      return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }
  return new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
