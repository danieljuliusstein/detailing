'use client'

import { useEffect, useState } from 'react'
import { DownloadSimple, FileCsv } from '@phosphor-icons/react'
import { getPLReport, exportJobsCSV, type DateRangeKey, type PLReport } from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
]

const expenseLabels: Record<keyof PLReport['expenses'], string> = {
  supplies: 'Supplies', travel: 'Travel', equipment: 'Equipment',
  marketing: 'Marketing', labor: 'Labor', overhead: 'Overhead', other: 'Other',
}

export default function Reports() {
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [report, setReport] = useState<PLReport | null>(null)

  useEffect(() => {
    getPLReport(range).then(setReport)
  }, [range])

  const handleCSV = async () => {
    const csv = await exportJobsCSV(range)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobs-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!report) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  const marginColor = report.marginPct >= 50 ? 'var(--green)' : report.marginPct >= 30 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="screen page-content">
      <div style={{ paddingTop: 16, paddingBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Reports</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{report.jobCount} jobs in range</div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {RANGES.map((r) => {
          const active = range === r.key
          return (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: active ? 'var(--green)' : 'var(--bg-surface)',
              color: active ? '#071407' : 'var(--text-muted)',
            }}>{r.label}</button>
          )
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Profit & loss</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>Revenue</span>
          <span className="money" style={{ fontSize: 14, fontWeight: 600 }}>{fmtDetailed(report.revenue)}</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Expenses</div>
        {(Object.keys(expenseLabels) as (keyof PLReport['expenses'])[]).map((key) => {
          const val = report.expenses[key]
          if (val === 0) return null
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{expenseLabels[key]}</span>
              <span className="money money-negative" style={{ fontSize: 13 }}>−{fmtDetailed(val)}</span>
            </div>
          )
        })}

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Net profit</span>
          <span className="money money-positive" style={{ fontSize: 16, fontWeight: 700 }}>{fmtDetailed(report.netProfit)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Margin <span style={{ color: marginColor, fontWeight: 600 }}>{report.marginPct}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <DownloadSimple size={18} /> PDF
        </button>
        <button className="btn-ghost" onClick={handleCSV} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FileCsv size={18} /> CSV
        </button>
      </div>
    </div>
  )
}
