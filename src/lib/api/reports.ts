import { computeJobsCSV, computePLReport } from './aggregates'
import { getOverheadForRange } from './overhead-local'
import { loadData } from '../storage'
import type { Job } from '../types'

export type DateRangeKey = 'this_week' | 'this_month' | 'last_month' | 'this_year'
export type { PLReport } from './aggregates'

export function getPLReportFromJobs(jobs: Job[], range: DateRangeKey) {
  const overhead = getOverheadForRange(range)
  return computePLReport(jobs, range, overhead)
}

export function exportJobsCSVFromJobs(jobs: Job[], range: DateRangeKey): string {
  const data = loadData()
  return computeJobsCSV(jobs, range, (job) => ({
    client: data.clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: data.packages.find((p) => p.id === job.package_id)?.name ?? '',
  }))
}

/** @deprecated Use getPLReport from api/index — kept for local fallback */
export function getPLReport(range: DateRangeKey) {
  const data = loadData()
  return computePLReport(data.jobs, range)
}

/** @deprecated Use exportJobsCSV from api/index */
export function exportJobsCSV(range: DateRangeKey): string {
  const data = loadData()
  return computeJobsCSV(data.jobs, range, (job) => ({
    client: data.clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: data.packages.find((p) => p.id === job.package_id)?.name ?? '',
  }))
}
