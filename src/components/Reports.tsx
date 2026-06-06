'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DownloadSimple, FileCsv } from '@phosphor-icons/react'
import PLProgressBarCard from '@/components/reports/PLProgressBarCard'
import { exportJobsCSV, getClients, getJobs, getPLReportBundle, type DateRangeKey } from '@/lib/api'
import { buildLeadSourceReport, type LeadSourceRow } from '@/lib/lead-source-report'
import type { PLReport } from '@/lib/api/aggregates'
import { fmt, fmtDetailed, isLoss } from '@/lib/calculations'
import { downloadReportPdf } from '@/lib/pdf/downloadReportPdf'
import { loadSettings } from '@/lib/settings'
import {
  EXPENSE_ORDER,
  EXPENSE_LABELS,
  MARGIN_TARGET_PCT,
  REPORT_FILTER_CHIPS,
  computeDeltas,
  dollarDeltaClass,
  formatBreakdownNetProfit,
  formatDollarDelta,
  formatKpiNetProfit,
  formatMarginPill,
  formatPercentDelta,
  formatTotalExpensesAmount,
  marginPillClass,
  percentDeltaClass,
} from '@/lib/reports-metrics'
import { FINANCIAL_DATA_CHANGED } from '@/lib/financial-data-events'

export default function Reports() {
  const pathname = usePathname()
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [current, setCurrent] = useState<PLReport | null>(null)
  const [prior, setPrior] = useState<PLReport | null>(null)
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
    Promise.all([getClients(), getJobs()]).then(([clients, jobs]) => {
      setLeadSourceRows(buildLeadSourceReport(clients, jobs, range))
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

  const deltas = useMemo(() => {
    if (!current || !prior) return null
    return computeDeltas(current, prior)
  }, [current, prior])

  const expenseRows = useMemo(() => {
    if (!current) return []
    return EXPENSE_ORDER
      .map((key) => ({ key, label: EXPENSE_LABELS[key], amount: current.expenses[key] }))
      .filter((row) => row.amount > 0)
  }, [current])

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

  if (!current || !prior || !deltas) {
    return (
      <div className="screen page-content reports-screen" style={{ paddingTop: 40, textAlign: 'center', color: '#555' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="screen page-content reports-screen">
      <div className="reports-header">
        <div className="reports-title">Reports</div>
        <div className="reports-subtitle">{current.jobCount} jobs in range</div>
      </div>

      <div className="reports-filter-chips">
        {REPORT_FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`reports-filter-chip${range === chip.key ? ' reports-filter-chip--active' : ''}`}
            onClick={() => setRange(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="reports-kpi-grid">
        <div className="reports-kpi-card">
          <div className="reports-kpi-label">REVENUE</div>
          <div className="reports-kpi-value">{fmt(current.revenue)}</div>
          <div
            className={`reports-kpi-delta ${percentDeltaClass(current.revenue, prior.revenue, 'revenue')}`}
          >
            {formatPercentDelta(current.revenue, prior.revenue, range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">NET PROFIT</div>
          <div
            className={`reports-kpi-value ${
              isLoss(current.netProfit) ? 'reports-kpi-value--loss' : 'reports-kpi-value--green'
            }`}
          >
            {formatKpiNetProfit(current.netProfit)}
          </div>
          <div
            className={`reports-kpi-delta ${percentDeltaClass(current.netProfit, prior.netProfit, 'profit')}`}
          >
            {formatPercentDelta(current.netProfit, prior.netProfit, range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">TOTAL EXPENSES</div>
          <div className="reports-kpi-value">{fmt(current.totalExpenses)}</div>
          <div
            className={`reports-kpi-delta ${dollarDeltaClass(current.totalExpenses, prior.totalExpenses)}`}
          >
            {formatDollarDelta(current.totalExpenses, prior.totalExpenses, range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">MARGIN</div>
          <div
            className={`reports-kpi-value ${
              isLoss(current.marginPct) ? 'reports-kpi-value--loss' : 'reports-kpi-value--green'
            }`}
          >
            {current.marginPct}%
          </div>
          <div className="reports-kpi-delta reports-delta--neutral">
            target: {MARGIN_TARGET_PCT}%
          </div>
        </div>
      </div>

      <PLProgressBarCard report={current} range={range} />

      <div className="reports-card">
        <div className="reports-card-label">PROFIT &amp; LOSS BREAKDOWN</div>

        <div className="reports-pl-row reports-pl-row--revenue">
          <div className="reports-pl-left">
            <span className="reports-pl-dot reports-pl-dot--green" />
            <span className="reports-pl-name reports-pl-name--headline">Revenue</span>
          </div>
          <span className="reports-pl-amount reports-pl-amount--headline">{fmtDetailed(current.revenue)}</span>
        </div>

        <div className="reports-expenses-section">
          <div className="reports-expenses-label">EXPENSES</div>
          {expenseRows.map((row) => (
            <div key={row.key} className="reports-expense-row">
              <span className="reports-expense-name">{row.label}</span>
              <span className="reports-expense-amount">−{fmtDetailed(row.amount)}</span>
            </div>
          ))}
          <div className="reports-total-expenses-inset">
            <span className="reports-total-expenses-label">Total expenses</span>
            <span className="reports-total-expenses-amount">
              {formatTotalExpensesAmount(current.totalExpenses)}
            </span>
          </div>
        </div>

        <div className="reports-pl-row reports-pl-row--profit">
          <div className="reports-pl-left">
            <span
              className={`reports-pl-dot ${
                isLoss(current.netProfit) ? 'reports-pl-dot--red' : 'reports-pl-dot--green'
              }`}
            />
            <span className="reports-pl-name reports-pl-name--bold">Net profit</span>
          </div>
          <span
            className={`reports-pl-amount ${
              isLoss(current.netProfit) ? 'reports-pl-amount--loss' : 'reports-pl-amount--profit'
            }`}
          >
            {formatBreakdownNetProfit(current.netProfit)}
          </span>
        </div>

        <div className="reports-margin-row">
          <span className="reports-margin-label">Margin</span>
          <span className={marginPillClass(current.marginPct)}>{formatMarginPill(current.marginPct)}</span>
        </div>
      </div>

      {leadSourceRows.length > 0 && (
        <div className="reports-card" style={{ marginBottom: 16 }}>
          <div className="reports-card-label">LEAD SOURCE ROI</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Revenue and jobs by how clients found you
          </div>
          {leadSourceRows.map((row) => {
            const maxRevenue = leadSourceRows[0]?.revenue ?? 1
            const pct = Math.round((row.revenue / maxRevenue) * 100)
            return (
              <div key={row.source} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{row.source}</span>
                  <span className="money" style={{ color: 'var(--green)' }}>{fmt(row.revenue)}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {row.clientCount} client{row.clientCount !== 1 ? 's' : ''} · {row.jobCount} job{row.jobCount !== 1 ? 's' : ''} · avg {fmt(row.avgTicket)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="reports-export-grid">
        <button type="button" className="reports-export-btn" onClick={handlePdf} disabled={exportBusy}>
          <DownloadSimple size={18} color="#555" weight="regular" />
          {exportBusy ? 'Exporting…' : 'PDF'}
        </button>
        <button type="button" className="reports-export-btn" onClick={handleCSV} disabled={exportBusy}>
          <FileCsv size={18} color="#555" weight="regular" />
          CSV
        </button>
      </div>

      {exportMessage && (
        <div style={{ fontSize: 13, color: '#e06060', textAlign: 'center', marginTop: 8 }}>{exportMessage}</div>
      )}
    </div>
  )
}
