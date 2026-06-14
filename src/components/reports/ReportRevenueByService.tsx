'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PLReport } from '@/lib/api/aggregates'
import { fmtDetailed } from '@/lib/calculations'
import { aggregateJobsRevenue, filterJobsByRange } from '@/lib/jobs-revenue'
import type { DateRangeKey } from '@/lib/api/reports'
import type { JobWithRelations } from '@/lib/types'

interface ReportRevenueByServiceProps {
  jobs: JobWithRelations[]
  range: DateRangeKey
}

export default function ReportRevenueByService({ jobs, range }: ReportRevenueByServiceProps) {
  const [animate, setAnimate] = useState(false)
  const stats = useMemo(() => aggregateJobsRevenue(filterJobsByRange(jobs, range)), [jobs, range])

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [stats])

  if (stats.services.length === 0) {
    return <div className="money-empty">No revenue in this period</div>
  }

  const max = stats.services[0]?.amount ?? 1

  return (
    <div className="money-breakdown">
      {stats.services.map((service) => {
        const pct = stats.totalRevenue > 0 ? Math.round((service.amount / stats.totalRevenue) * 100) : 0
        const barPct = max > 0 ? Math.round((service.amount / max) * 100) : 0
        return (
          <div key={service.label} className="money-row">
            <div className="money-row-head">
              <span className="money-row-label">{service.label}</span>
              <div className="money-row-right">
                <span className="money-row-amount">{fmtDetailed(service.amount)}</span>
                <span className="money-row-pct">{pct}%</span>
              </div>
            </div>
            <div className="money-track">
              <div
                className="money-fill money-fill--green"
                style={{ width: animate ? `${barPct}%` : '0%' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
