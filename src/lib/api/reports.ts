import {
  computeJobsCSV,
  computePLReport,
  computePLReportForDates,
  priorRangeFor,
  rangeFor,
  type PLReport,
} from './aggregates'
import { getOverheadExpenses } from './overhead-local'
import { overheadAmountForDates } from '../supplies-logic'
import { loadData } from '../storage'
import type { Job } from '../types'

export type DateRangeKey = 'this_week' | 'this_month' | 'last_month' | 'this_year'
export type { PLReport } from './aggregates'

export interface PLReportBundle {
  current: PLReport
  prior: PLReport
}

export function getPLReportFromJobs(jobs: Job[], range: DateRangeKey): PLReport {
  const expenses = getOverheadExpenses()
  const { start, end } = rangeFor(range)
  const overhead = overheadAmountForDates(expenses, start, end)
  return computePLReport(jobs, range, overhead)
}

export function getPLReportBundleFromJobs(jobs: Job[], range: DateRangeKey): PLReportBundle {
  const expenses = getOverheadExpenses()
  const { start, end } = rangeFor(range)
  const prior = priorRangeFor(range)
  const currentOverhead = overheadAmountForDates(expenses, start, end)
  const priorOverhead = overheadAmountForDates(expenses, prior.start, prior.end)
  return {
    current: computePLReportForDates(jobs, start, end, currentOverhead),
    prior: computePLReportForDates(jobs, prior.start, prior.end, priorOverhead),
  }
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
