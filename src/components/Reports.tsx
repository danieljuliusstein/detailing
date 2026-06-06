'use client'

import { useEffect, useMemo, useState } from 'react'
import { DownloadSimple, FileCsv } from '@phosphor-icons/react'
import PLProgressBarCard from '@/components/reports/PLProgressBarCard'
import { exportJobsCSV, getPLReportBundle, type DateRangeKey } from '@/lib/api'
import type { PLReport } from '@/lib/api/aggregates'
import { fmt, fmtDetailed } from '@/lib/calculations'
import { downloadReportPdf } from '@/lib/pdf/downloadReportPdf'
import { loadSettings } from '@/lib/settings'
import {
  EXPENSE_ORDER,
  EXPENSE_LABELS,
  MARGIN_TARGET_PCT,
  REPORT_FILTER_CHIPS,
  computeDeltas,
  deltaClass,
  formatDelta,
} from '@/lib/reports-metrics'

export default function Reports() {
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [current, setCurrent] = useState<PLReport | null>(null)
  const [prior, setPrior] = useState<PLReport | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    getPLReportBundle(range).then(({ current: c, prior: p }) => {
      setCurrent(c)
      setPrior(p)
    })
  }, [range])

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

  if (!current || !deltas) {
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
          <div className={`reports-kpi-delta ${deltaClass(deltas.revenuePct, 'revenue')}`}>
            {formatDelta(deltas.revenuePct, 'percent', range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">NET PROFIT</div>
          <div className="reports-kpi-value reports-kpi-value--green">{fmt(current.netProfit)}</div>
          <div className={`reports-kpi-delta ${deltaClass(deltas.profitPct, 'profit')}`}>
            {formatDelta(deltas.profitPct, 'percent', range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">TOTAL EXPENSES</div>
          <div className="reports-kpi-value">{fmt(current.totalExpenses)}</div>
          <div className={`reports-kpi-delta ${deltaClass(deltas.expenseDollar, 'expense')}`}>
            {formatDelta(deltas.expenseDollar, 'dollar', range)}
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="reports-kpi-label">MARGIN</div>
          <div className="reports-kpi-value reports-kpi-value--green">{current.marginPct}%</div>
          <div className="reports-kpi-delta reports-delta--neutral">
            target: {MARGIN_TARGET_PCT}%
          </div>
        </div>
      </div>

      <PLProgressBarCard report={current} range={range} />

      <div className="reports-card">
        <div className="reports-card-label">PROFIT &amp; LOSS BREAKDOWN</div>

        <div className="reports-pl-row">
          <div className="reports-pl-left">
            <span className="reports-pl-dot reports-pl-dot--green" />
            <span className="reports-pl-name">Revenue</span>
          </div>
          <span className="reports-pl-amount">{fmtDetailed(current.revenue)}</span>
        </div>

        <div className="reports-expenses-section">
          <div className="reports-expenses-label">EXPENSES</div>
          {expenseRows.map((row) => {
            const pct = current.totalExpenses > 0
              ? (row.amount / current.totalExpenses) * 100
              : 0
            return (
              <div key={row.key} className="reports-expense-block">
                <div className="reports-expense-row">
                  <span className="reports-expense-name">{row.label}</span>
                  <span className="reports-expense-amount">−{fmtDetailed(row.amount)}</span>
                </div>
                <div className="reports-expense-bar-track">
                  <div className="reports-expense-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="reports-pl-divider" />

        <div className="reports-pl-row reports-pl-row--profit">
          <div className="reports-pl-left">
            <span className="reports-pl-dot reports-pl-dot--green" />
            <span className="reports-pl-name reports-pl-name--bold">Net profit</span>
          </div>
          <span className="reports-pl-amount reports-pl-amount--profit">{fmtDetailed(current.netProfit)}</span>
        </div>

        <div className="reports-margin-row">
          <span className="reports-margin-label">Margin</span>
          <span className="reports-margin-pill">{current.marginPct}%</span>
        </div>
      </div>

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
