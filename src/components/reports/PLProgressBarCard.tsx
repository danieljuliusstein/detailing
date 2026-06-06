'use client'

import { useEffect, useState } from 'react'
import type { PLReport } from '@/lib/api/aggregates'
import type { DateRangeKey } from '@/lib/api/reports'
import {
  buildPLProgressBars,
  plProgressPeriodLabel,
  revenuePct,
  type PLProgressBar,
} from '@/lib/reports-metrics'

interface BarRowProps {
  bar: PLProgressBar
  revenue: number
  animate: boolean
}

function formatBarAmount(bar: PLProgressBar): string {
  const prefix = bar.isExpense ? '−' : ''
  return `${prefix}$${bar.value.toLocaleString()}`
}

function BarRow({ bar, revenue, animate }: BarRowProps) {
  const pct = revenuePct(bar.value, revenue)
  const width = revenue > 0 ? (bar.value / revenue) * 100 : 0

  return (
    <div className="pl-bar-row">
      <div className="pl-bar-meta">
        <span className={`pl-bar-name${bar.highlight ? ' pl-bar-name--highlight' : ''}`}>{bar.name}</span>
        <div className="pl-bar-amount-wrap">
          <span
            className={`pl-bar-amount${
              bar.isProfit ? ' pl-bar-amount--profit' : bar.isExpense ? ' pl-bar-amount--expense' : ''
            }`}
          >
            {formatBarAmount(bar)}
          </span>
          <span className="pl-bar-pct">{pct}%</span>
        </div>
      </div>
      <div className={`pl-bar-track${bar.isProfit ? ' pl-bar-track--profit' : ''}`}>
        <div
          className="pl-bar-fill"
          style={{
            width: animate ? `${width}%` : '0%',
            backgroundColor: bar.color,
          }}
        />
      </div>
    </div>
  )
}

interface PLProgressBarCardProps {
  report: PLReport
  range: DateRangeKey
}

export default function PLProgressBarCard({ report, range }: PLProgressBarCardProps) {
  const [animate, setAnimate] = useState(false)
  const { revenue, expenseBars, profitBar } = buildPLProgressBars(report)

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [report, range])

  const revenueBar: PLProgressBar = {
    name: 'Revenue',
    value: revenue,
    color: '#3dc97a',
    highlight: true,
    isExpense: false,
  }

  return (
    <div className="pl-progress-card">
      <div className="pl-progress-label">PROFIT &amp; LOSS — {plProgressPeriodLabel(range)}</div>

      <div className="pl-progress-bars">
        <BarRow bar={revenueBar} revenue={revenue} animate={animate} />

        <div className="pl-progress-divider" />
        <div className="pl-progress-expenses-label">EXPENSES</div>

        {expenseBars.map((bar) => (
          <BarRow key={bar.name} bar={bar} revenue={revenue} animate={animate} />
        ))}

        <div className="pl-progress-divider" />

        <BarRow bar={profitBar} revenue={revenue} animate={animate} />
      </div>
    </div>
  )
}
