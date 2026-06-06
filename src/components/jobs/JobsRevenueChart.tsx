'use client'

import { useMemo, useState } from 'react'
import { fmt } from '@/lib/calculations'
import {
  FILTER_CHIPS,
  aggregateJobsRevenue,
  donutArcPath,
  filterJobsByRange,
  rangePeriodLabel,
  type ServiceSlice,
} from '@/lib/jobs-revenue'
import type { DateRangeKey } from '@/lib/api/reports'
import type { JobWithRelations } from '@/lib/types'

const CX = 90
const CY = 90
const OUTER_R = 78
const INNER_R = 50

interface JobsRevenueChartProps {
  jobs: JobWithRelations[]
}

export default function JobsRevenueChart({ jobs }: JobsRevenueChartProps) {
  const [range, setRange] = useState<DateRangeKey>('this_month')
  const [hovered, setHovered] = useState<ServiceSlice | null>(null)

  const filtered = useMemo(() => filterJobsByRange(jobs, range), [jobs, range])
  const stats = useMemo(() => aggregateJobsRevenue(filtered), [filtered])
  const period = rangePeriodLabel(range)

  const slices = useMemo(() => {
    if (stats.totalRevenue <= 0 || stats.services.length === 0) return []
    let angle = -Math.PI / 2
    return stats.services.map((service) => {
      const sweep = (service.amount / stats.totalRevenue) * Math.PI * 2
      const start = angle
      const end = angle + sweep
      angle = end
      return { ...service, start, end, path: donutArcPath(CX, CY, OUTER_R, INNER_R, start, end) }
    })
  }, [stats])

  const centerTop = hovered ? fmt(hovered.amount) : fmt(stats.totalRevenue)
  const centerBottom = hovered ? hovered.label : 'total revenue'

  const highlightLabel = hovered?.label ?? null

  return (
    <div className="jobs-chart-block">
      <div className="jobs-chart-header">
        <div className="jobs-chart-title">Jobs</div>
        <div className="jobs-chart-subtitle">
          {filtered.length} total · {period}
        </div>
      </div>

      <div className="jobs-filter-chips">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`jobs-filter-chip${range === chip.key ? ' jobs-filter-chip--active' : ''}`}
            onClick={() => {
              setRange(chip.key)
              setHovered(null)
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="jobs-chart-card">
        <div className="jobs-chart-label">REVENUE BY SERVICE</div>

        {slices.length === 0 ? (
          <div className="jobs-chart-empty">No jobs in this period</div>
        ) : (
          <>
            <div className="jobs-donut-wrap">
              <svg width="180" height="180" viewBox="0 0 180 180" className="jobs-donut-svg">
                {slices.map((slice) => (
                  <path
                    key={slice.label}
                    d={slice.path}
                    fill={slice.color}
                    opacity={highlightLabel && highlightLabel !== slice.label ? 0.35 : hovered?.label === slice.label ? 1 : 0.9}
                    className="jobs-donut-slice"
                    onMouseEnter={() => setHovered(slice)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setHovered(hovered?.label === slice.label ? null : slice)}
                  />
                ))}
                <circle cx={CX} cy={CY} r={INNER_R - 1} fill="#1e1e1e" />
              </svg>
              <div className="jobs-donut-center">
                <div className="jobs-donut-center-value">{centerTop}</div>
                <div className="jobs-donut-center-label">{centerBottom}</div>
              </div>
            </div>

            <div className="jobs-legend">
              {stats.services.map((service) => {
                const pct = stats.totalRevenue > 0
                  ? Math.round((service.amount / stats.totalRevenue) * 100)
                  : 0
                return (
                  <button
                    key={service.label}
                    type="button"
                    className="jobs-legend-row"
                    onMouseEnter={() => setHovered(service)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setHovered(hovered?.label === service.label ? null : service)}
                  >
                    <div className="jobs-legend-left">
                      <span className="jobs-legend-dot" style={{ background: service.color }} />
                      <span className="jobs-legend-name">{service.label}</span>
                    </div>
                    <div className="jobs-legend-right">
                      <div className="jobs-legend-amount">{fmt(service.amount)}</div>
                      <div className="jobs-legend-pct">{pct}%</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="jobs-chart-divider" />

        <div className="jobs-stat-grid">
          <div className="jobs-stat-box">
            <div className="jobs-stat-label">NET PROFIT</div>
            <div className="jobs-stat-value jobs-stat-value--green">{fmt(stats.totalProfit)}</div>
          </div>
          <div className="jobs-stat-box">
            <div className="jobs-stat-label">JOBS</div>
            <div className="jobs-stat-value">{stats.jobCount}</div>
          </div>
          <div className="jobs-stat-box">
            <div className="jobs-stat-label">AVG JOB VALUE</div>
            <div className="jobs-stat-value">{fmt(stats.avgJobValue)}</div>
          </div>
          <div className="jobs-stat-box">
            <div className="jobs-stat-label">MARGIN</div>
            <div className="jobs-stat-value jobs-stat-value--green">{stats.margin}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
