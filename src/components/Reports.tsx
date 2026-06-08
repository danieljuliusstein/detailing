'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DownloadSimple, FileCsv } from '@phosphor-icons/react'
import ReportComparisonChart from '@/components/reports/ReportComparisonChart'
import ReportExpenseBreakdown from '@/components/reports/ReportExpenseBreakdown'
import ReportHeroCard from '@/components/reports/ReportHeroCard'
import ReportLeadSources from '@/components/reports/ReportLeadSources'
import ReportSection from '@/components/reports/ReportSection'
import { exportJobsCSV, getClients, getJobs, getPLReportBundle, type DateRangeKey } from '@/lib/api'
import { buildLeadSourceReport, type LeadSourceRow } from '@/lib/lead-source-report'
import type { PLReport } from '@/lib/api/aggregates'
import { downloadReportPdf } from '@/lib/pdf/downloadReportPdf'
import { loadSettings } from '@/lib/settings'
import { REPORT_FILTER_CHIPS, shouldShowLeadSourceReport } from '@/lib/reports-metrics'
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
      <div className="screen page-content reports-screen" style={{ paddingTop: 40, textAlign: 'center', color: '#555' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="screen page-content reports-screen">
      <div className="reports-header">
        <div className="reports-title">Reports</div>
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

      <ReportHeroCard report={current} prior={prior} range={range} />

      <ReportSection label="Expense breakdown" subtitle="Share of total expenses">
        <ReportExpenseBreakdown report={current} />
      </ReportSection>

      <ReportSection label="Revenue vs expenses" subtitle="Why you made or lost money">
        <ReportComparisonChart report={current} />
      </ReportSection>

      {showLeadSources && (
        <ReportSection label="Lead sources" subtitle="Where your clients come from">
          <ReportLeadSources rows={leadSourceRows} />
        </ReportSection>
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
        <div className="reports-export-error">{exportMessage}</div>
      )}
    </div>
  )
}
