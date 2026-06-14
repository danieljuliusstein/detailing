'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DownloadSimple, FileCsv } from '@phosphor-icons/react'
import ReportComparisonChart from '@/components/reports/ReportComparisonChart'
import ReportExpenseBreakdown from '@/components/reports/ReportExpenseBreakdown'
import ReportRevenueByService from '@/components/reports/ReportRevenueByService'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { exportJobsCSV, getClients, getJobs, getPLReportBundle, type DateRangeKey } from '@/lib/api'
import { buildLeadSourceReport, type LeadSourceRow } from '@/lib/lead-source-report'
import type { PLReport } from '@/lib/api/aggregates'
import { downloadReportPdf } from '@/lib/pdf/downloadReportPdf'
import { loadSettings } from '@/lib/settings'
import { REPORT_FILTER_CHIPS, buildExpenseBreakdown, shouldShowLeadSourceReport } from '@/lib/reports-metrics'
import { FINANCIAL_DATA_CHANGED } from '@/lib/financial-data-events'
import { fmt } from '@/lib/calculations'
import { isLoss } from '@/lib/calculations'
import type { JobWithRelations } from '@/lib/types'
import { rangePeriodLabel } from '@/lib/jobs-revenue'

const MONEY_CHIPS = REPORT_FILTER_CHIPS.filter((c) =>
  ['this_week', 'this_month', 'last_month'].includes(c.key)
)

export default function Reports() {
  const pathname = usePathname()
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [current, setCurrent] = useState<PLReport | null>(null)
  const [prior, setPrior] = useState<PLReport | null>(null)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [exportBusy, setExportBusy] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [leadSourceRows, setLeadSourceRows] = useState<LeadSourceRow[]>([])

  const loadReport = useCallback(() => {
    getPLReportBundle(range).then(({ current: c, prior: p }) => {
      setCurrent(c)
      setPrior(p)
    })
  }, [range])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  useEffect(() => {
    getJobs().then(setJobs)
    Promise.all([getClients(), getJobs()]).then(([clients, jobList]) => {
      setLeadSourceRows(buildLeadSourceReport(clients, jobList, range))
    })
  }, [range])

  useEffect(() => {
    const onDataChanged = () => loadReport()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && pathname === '/reports') loadReport()
    }
    window.addEventListener(FINANCIAL_DATA_CHANGED, onDataChanged)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener(FINANCIAL_DATA_CHANGED, onDataChanged)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadReport, pathname])

  const handleCSV = async () => {
    setExportMessage('')
    setExportBusy(true)
    try {
      const csv = await exportJobsCSV(range)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobs-${range}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setExportMessage(e instanceof Error ? e.message : 'CSV export failed')
    } finally {
      setExportBusy(false)
    }
  }

  const handlePdf = async () => {
    if (!current) return
    setExportMessage('')
    setExportBusy(true)
    try {
      const settings = loadSettings()
      await downloadReportPdf(current, range, settings.business_name)
    } catch (e) {
      setExportMessage(e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setExportBusy(false)
    }
  }

  const showLeadSources = current
    ? shouldShowLeadSourceReport(leadSourceRows.length, current.jobCount)
    : false

  if (!current || !prior) {
    return (
      <div className="screen page-content body" style={{ paddingTop: 40, textAlign: 'center', color: '#555' }}>
        Loading…
      </div>
    )
  }

  const loss = isLoss(current.netProfit)
  const expenseCategories = buildExpenseBreakdown(current).length
  const expenseRatio =
    current.revenue > 0 ? (current.totalExpenses / current.revenue).toFixed(1) : null

  return (
    <div className="screen page-content body money-screen">
      <header className="page-header">
        <div>
          <h1>Money</h1>
          <p>
            {rangePeriodLabel(range)} · {current.jobCount} job{current.jobCount === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      <div className="chips">
        {MONEY_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`chip${range === chip.key ? ' active' : ''}`}
            onClick={() => setRange(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className={`money-hero${loss ? ' money-hero--loss' : ' money-hero--profit'}`}>
        <div className="money-hero-label">{loss ? 'Net loss' : 'Net profit'}</div>
        <CurrencyAmount
          value={current.netProfit}
          variant="profit"
          className="money-hero-value"
        />
        {loss && expenseRatio && (
          <div className="money-hero-sub">Expenses exceeded revenue by {expenseRatio}x</div>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">{fmt(current.revenue)}</div>
          <div className="stat-sub">{current.jobCount} jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value money-stat--red">{fmt(current.totalExpenses)}</div>
          <div className="stat-sub money-stat-sub--red">{expenseCategories} categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net profit</div>
          <div className="stat-value">{fmt(current.netProfit)}</div>
          <div className="stat-sub">from jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg job value</div>
          <div className="stat-value">
            {fmt(current.jobCount > 0 ? Math.round(current.revenue / current.jobCount) : 0)}
          </div>
          <div className="stat-sub">per job</div>
        </div>
      </div>

      <p className="sec">Revenue by service</p>
      <ReportRevenueByService jobs={jobs} range={range} />

      <p className="sec">Expense breakdown</p>
      <ReportExpenseBreakdown report={current} />

      <p className="sec">Revenue vs expenses</p>
      <ReportComparisonChart report={current} />

      {showLeadSources && (
        <>
          <p className="sec">Lead sources</p>
          {/* kept minimal — existing component available if needed */}
        </>
      )}

      <div className="money-export-row">
        <button type="button" className="money-export-btn" onClick={handlePdf} disabled={exportBusy}>
          <DownloadSimple size={16} aria-hidden="true" />
          Export PDF
        </button>
        <button type="button" className="money-export-btn" onClick={handleCSV} disabled={exportBusy}>
          <FileCsv size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {exportMessage && <div className="reports-export-error">{exportMessage}</div>}
    </div>
  )
}
