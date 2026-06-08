'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Gear, Lightbulb } from '@phosphor-icons/react'
import { timeAgo } from '@/lib/client-relationship-logic'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { JOB_STATUS_CONFIG, jobStatusLabel } from '@/lib/job-status-display'
import type { ClientWithStats, DashboardKpis, RecentJobRow, WeekDay } from '@/lib/types'

interface DashboardProps {
  kpis: DashboardKpis
  recentJobs: RecentJobRow[]
  jobsToday: number
  weekDays: WeekDay[]
  dayJobs: RecentJobRow[]
  dueClients: ClientWithStats[]
  insights: string[]
  onDaySelect: (date: string) => void
  selectedDate: string
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  const showExpenses = kpis.expensesMtd > 0

  return (
    <div className={`dashboard-kpi-grid ${showExpenses ? '' : 'dashboard-kpi-grid--no-expenses'}`}>
      <div className="kpi-card">
        <div className="kpi-label">Revenue MTD</div>
        <CurrencyAmount value={kpis.revenueMtd} variant="revenue" className="kpi-value kpi-value--hero" />
      </div>

      {showExpenses ? (
        <div className="kpi-card">
          <div className="kpi-label">Expenses MTD</div>
          <CurrencyAmount value={kpis.expensesMtd} variant="expense" unsigned className="kpi-value kpi-value--hero" />
        </div>
      ) : (
        <div className="kpi-card">
          <div className="kpi-label">Outstanding</div>
          <CurrencyAmount value={kpis.outstanding} variant="balance" className="kpi-value kpi-value--hero" />
        </div>
      )}

      <div className={`kpi-card ${showExpenses ? '' : 'kpi-card--span'}`}>
        <div className="kpi-label">{kpis.profitMtd < 0 ? 'Net Loss MTD' : 'Net Profit MTD'}</div>
        <CurrencyAmount value={kpis.profitMtd} variant="profit" className="kpi-value kpi-value--hero" />
        {kpis.revenueMtd > 0 && (
          <div className="kpi-sub">{kpis.marginMtd}% margin</div>
        )}
      </div>

      {showExpenses && (
        <div className="kpi-card">
          <div className="kpi-label">Outstanding</div>
          <CurrencyAmount value={kpis.outstanding} variant="balance" className="kpi-value kpi-value--hero" />
        </div>
      )}
    </div>
  )
}

function TodaysFocus({ kpis, jobsToday }: { kpis: DashboardKpis; jobsToday: number }) {
  return (
    <div className="today-focus-card">
      <div className="today-focus-title">Today&apos;s Focus</div>
      <div className="today-focus-row">
        <span className="today-focus-label">Today&apos;s Jobs</span>
        <span className="today-focus-value">{jobsToday}</span>
      </div>
      <div className="today-focus-row">
        <span className="today-focus-label">Outstanding Invoices</span>
        <span className={`today-focus-value ${kpis.outstandingInvoiceCount > 0 ? 'today-focus-value--alert' : ''}`}>
          {kpis.outstandingInvoiceCount}
        </span>
      </div>
      <div className="today-focus-row">
        <span className="today-focus-label">Revenue Today</span>
        <CurrencyAmount value={kpis.revenueToday} variant="revenue" className="today-focus-value" />
      </div>
    </div>
  )
}

function BusinessInsight({ insights }: { insights: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (insights.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % insights.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [insights.length])

  if (insights.length === 0) return null
  const insight = insights[index % insights.length]

  return (
    <div className="dashboard-insight">
      <Lightbulb size={14} weight="duotone" color="var(--text-muted)" aria-hidden="true" />
      <span>{insight}</span>
    </div>
  )
}

function JobRow({ job, onPress, compact }: { job: RecentJobRow; onPress: () => void; compact?: boolean }) {
  const status = JOB_STATUS_CONFIG[job.status]
  const subtitle = `${job.vehicleType} • ${capitalize(job.locationType)}`

  return (
    <div
      className={`card-pressable dashboard-job-card ${compact ? 'dashboard-job-card--compact' : ''}`}
      onClick={onPress}
    >
      <div className="dashboard-job-card__main">
        <div className="dashboard-job-card__name">{job.clientName}</div>
        <div className="dashboard-job-card__meta">{subtitle}</div>
        <span className={status.className}>{jobStatusLabel(job)}</span>
      </div>
      <div className="dashboard-job-card__figures">
        <CurrencyAmount value={job.revenue} variant="revenue" className="dashboard-job-card__revenue" />
        <div className="dashboard-job-card__profit">
          <CurrencyAmount value={job.profit} variant="profit" /> profit
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({
  kpis,
  recentJobs,
  jobsToday,
  weekDays,
  dayJobs,
  dueClients,
  insights,
  onDaySelect,
  selectedDate,
}: DashboardProps) {
  const router = useRouter()

  return (
    <div className="screen page-content">
      <div className="dashboard-header">
        <div style={{ flex: 1 }}>
          <div className="dashboard-greeting">{greeting()}</div>
          <div className="dashboard-date">{todayLabel()}</div>
        </div>
        <button
          onClick={() => router.push('/settings')}
          aria-label="Settings"
          className="dashboard-settings-btn"
        >
          <Gear size={22} weight="regular" color="var(--text-muted)" />
        </button>
      </div>

      <KpiGrid kpis={kpis} />
      <TodaysFocus kpis={kpis} jobsToday={jobsToday} />

      {dueClients.length > 0 && (
        <>
          <div className="section-title">Due for service</div>
          {dueClients.slice(0, 5).map((client) => (
            <div
              key={client.id}
              className="card-pressable dashboard-job-card dashboard-job-card--compact"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <div className="dashboard-job-card__main">
                <div className="dashboard-job-card__name">{client.name}</div>
                <div className="dashboard-job-card__meta">
                  Last visit {client.lastJobDate ? timeAgo(client.lastJobDate) : '—'} ·{' '}
                  <CurrencyAmount value={client.totalRevenue} variant="revenue" /> lifetime
                </div>
              </div>
              <span className="badge-status badge-status--yellow">Follow up</span>
            </div>
          ))}
          <div style={{ marginBottom: 16 }} />
        </>
      )}

      <div className="section-title">This week</div>
      <div className="dashboard-week-strip">
        {weekDays.map((day) => {
          const active = selectedDate === day.date
          return (
            <div
              key={day.date}
              onClick={() => onDaySelect(day.date)}
              className={`dashboard-week-day ${active ? 'dashboard-week-day--active' : ''} ${day.isToday ? 'dashboard-week-day--today' : ''}`}
            >
              <div className="dashboard-week-day__label">{day.label}</div>
              <div className="dashboard-week-day__num">{day.dayNum}</div>
              {day.jobCount > 0 && <div className="dashboard-week-day__dot" />}
            </div>
          )
        })}
      </div>

      {dayJobs.length > 0 && (
        <>
          {dayJobs.slice(0, 3).map((job) => (
            <JobRow key={job.id} job={job} compact onPress={() => router.push(`/jobs/${job.id}`)} />
          ))}
          {dayJobs.length > 3 && (
            <button
              onClick={() => router.push('/jobs')}
              className="dashboard-view-all-btn"
            >
              View all {dayJobs.length} jobs
            </button>
          )}
          <div style={{ marginBottom: 16 }} />
        </>
      )}

      <BusinessInsight insights={insights} />

      <div className="section-title">Recent jobs</div>
      {recentJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <Car size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No jobs yet — tap + to add your first</div>
        </div>
      ) : (
        recentJobs.map((job) => (
          <JobRow key={job.id} job={job} compact onPress={() => router.push(`/jobs/${job.id}`)} />
        ))
      )}
    </div>
  )
}
