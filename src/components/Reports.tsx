'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CaretRight, DownloadSimple, FileCsv, FileText, Receipt } from '@phosphor-icons/react'
import ReportComparisonChart from '@/components/reports/ReportComparisonChart'
import ReportExpenseBreakdown from '@/components/reports/ReportExpenseBreakdown'
import ReportRevenueByService from '@/components/reports/ReportRevenueByService'
import ReportSection from '@/components/reports/ReportSection'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { getJobs, getPLReportBundle, type DateRangeKey } from '@/lib/api'
import { computeJobsExportData, formatJobsExportCSV } from '@/lib/api/aggregates'
import { computeDashboardKpis, csvJobStatusLabel, rowTableNet } from '@/lib/jobs-dashboard-csv'
import type { PLReport } from '@/lib/api/aggregates'
import { downloadReportPdf } from '@/lib/pdf/downloadReportPdf'
import { loadSettings } from '@/lib/settings'
import { REPORT_FILTER_CHIPS, buildExpenseBreakdown } from '@/lib/reports-metrics'
import { FINANCIAL_DATA_CHANGED } from '@/lib/financial-data-events'
import { fmt } from '@/lib/calculations'
import { isLoss } from '@/lib/calculations'
import type { JobWithRelations } from '@/lib/types'
import { rangeDateSpanLabel, rangePeriodLabel } from '@/lib/jobs-revenue'

const MONEY_CHIPS = REPORT_FILTER_CHIPS.filter((c) =>
  ['this_week', 'this_month', 'last_month'].includes(c.key)
)

export default function Reports() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [current, setCurrent] = useState<PLReport | null>(null)
  const [prior, setPrior] = useState<PLReport | null>(null)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [exportBusy, setExportBusy] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)

  const exportData = useMemo(
    () =>
      computeJobsExportData(jobs, range, (job) => {
        const j = job as JobWithRelations
        return {
          client: j.client?.name ?? 'Unknown',
          pkg: j.package?.name ?? '—',
        }
      }),
    [jobs, range]
  )

  const exportKpis = useMemo(() => computeDashboardKpis(exportData.rows), [exportData.rows])

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

  const exportOptions = () => {
    const settings = loadSettings()
    return {
      periodLabel: rangePeriodLabel(range),
      periodRange: rangeDateSpanLabel(range),
      businessName: settings.business_name,
      priorRevenue: prior?.revenue,
    }
  }

  const downloadBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCSV = async () => {
    setExportMessage('')
    setExportBusy(true)
    try {
      const csv = formatJobsExportCSV(exportData.rows, exportData.summary, exportOptions())
      downloadBlob(
        `\uFEFF${csv}`,
        'text/csv;charset=utf-8',
        `jobs-${range}-${new Date().toISOString().slice(0, 10)}.csv`
      )
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
      await downloadReportPdf(current, range, settings.business_name, settings.logo_url)
    } catch (e) {
      setExportMessage(e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setExportBusy(false)
    }
  }

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

      {isLoggedOut ? (
        <p className="money-auth-note" role="status">
          Sign in to load your jobs, revenue, and expenses.
        </p>
      ) : null}

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

      <div className="money-summary">
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
      </div>

      <div className="money-context-links">
        <button type="button" className="money-context-link" onClick={() => router.push('/invoices')}>
          <Receipt size={18} aria-hidden="true" />
          Invoices
        </button>
        <button type="button" className="money-context-link" onClick={() => router.push('/quotes')}>
          <FileText size={18} aria-hidden="true" />
          Quotes
        </button>
      </div>

      <ReportSection label="Revenue by service">
        <ReportRevenueByService jobs={jobs} range={range} />
      </ReportSection>

      <ReportSection label="Expense breakdown">
        <ReportExpenseBreakdown report={current} />
      </ReportSection>

      <ReportSection label="Revenue vs expenses">
        <ReportComparisonChart report={current} />
      </ReportSection>

      <ReportSection label="Export" className="money-export-section">
        <div className="money-export-card" aria-label="Export data">
        <button
          type="button"
          className="money-export-preview__summary"
          onClick={() => setExportPreviewOpen((o) => !o)}
          aria-expanded={exportPreviewOpen}
        >
          <span className="money-export-preview__text">
            <span className="money-export-preview__label">Preview export data</span>
            <span className="money-export-preview__meta">
              {exportData.summary.jobCount} job{exportData.summary.jobCount === 1 ? '' : 's'} · {rangePeriodLabel(range)}
            </span>
          </span>
          <CaretRight
            size={16}
            className={`money-export-preview__chevron${exportPreviewOpen ? ' money-export-preview__chevron--open' : ''}`}
            aria-hidden="true"
          />
        </button>

        {exportPreviewOpen && (
          <div className="money-export-preview__body">
            {exportData.rows.length === 0 ? (
              <p className="money-export-empty">No jobs in this period. CSV and PDF will still include summary totals.</p>
            ) : (
              <div className="money-export-table-wrap">
                <table className="money-export-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Revenue</th>
                      <th>Tip</th>
                      <th>Net profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.rows.map((row, i) => (
                      <tr key={`${row.date}-${row.client}-${i}`}>
                        <td>
                          {new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td>{row.client}</td>
                        <td>{row.pkg}</td>
                        <td>{csvJobStatusLabel(row.status)}</td>
                        <td className="money-export-table__num">{fmt(row.revenue)}</td>
                        <td className="money-export-table__num">{row.tip > 0 ? fmt(row.tip) : '—'}</td>
                        <td className="money-export-table__num money-export-table__profit">
                          {row.status === 'scheduled' ? '—' : fmt(rowTableNet(row))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Totals (dashboard)</td>
                      <td className="money-export-table__num">{fmt(exportKpis.revenue)}</td>
                      <td className="money-export-table__num">{fmt(exportKpis.tips)}</td>
                      <td className="money-export-table__num money-export-table__profit">
                        {fmt(exportKpis.netProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="money-export-row">
          <button type="button" className="money-export-btn money-export-btn--primary" onClick={handlePdf} disabled={exportBusy}>
            <DownloadSimple size={16} aria-hidden="true" />
            Export PDF
          </button>
          <button type="button" className="money-export-btn" onClick={handleCSV} disabled={exportBusy}>
            <FileCsv size={16} aria-hidden="true" />
            Export CSV
          </button>
        </div>
        </div>
      </ReportSection>

      {exportMessage && <div className="reports-export-error">{exportMessage}</div>}
    </div>
  )
}
