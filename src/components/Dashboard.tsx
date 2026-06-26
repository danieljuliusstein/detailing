'use client'

import { useRouter } from 'next/navigation'
import { Car, ChatCircle, Funnel, Gear } from '@phosphor-icons/react'
import InventoryAlertCard from '@/components/home/InventoryAlertCard'
import { fmt } from '@/lib/calculations'
import {
  buildHomeWeekStats,
  formatStartTimeLabel,
  homeJobIconTone,
  homeJobStatusClass,
  homeJobStatusLabel,
  type ComingUpJobData,
  type InventoryAlertData,
} from '@/lib/home-dashboard'
import type { JobWithRelations, RecentJobRow, WeekDay } from '@/lib/types'

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

function HomeJobRow({ job, onPress }: { job: RecentJobRow; onPress: () => void }) {
  const tone = homeJobIconTone(job)
  const timeLabel = formatStartTimeLabel(job.startTime)

  return (
    <div
      className="job-card job-card--home"
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPress()}
    >
      <div className={`job-icon ${tone}`}>
        <Car size={16} weight="duotone" aria-hidden="true" />
      </div>
      <div className="job-body">
        <div className="job-name">{job.clientName}</div>
        <div className="job-meta">
          {job.package} · {job.vehicleType}
        </div>
        <span className={homeJobStatusClass(job)}>{homeJobStatusLabel(job)}</span>
      </div>
      <div className="job-right">
        {timeLabel && <div className="job-amount">{timeLabel}</div>}
        <div className="job-date">{capitalize(job.locationType)}</div>
      </div>
    </div>
  )
}

function UpcomingRow({ job, onPress }: { job: ComingUpJobData; onPress: () => void }) {
  const pending = job.statusLabel === 'Pending'
  return (
    <button type="button" className="upcoming-card" onClick={onPress}>
      <div className="upcoming-date">
        <div className="upcoming-month">{job.monthLabel}</div>
        <div className="upcoming-day">{job.dayLabel}</div>
      </div>
      <div className="upcoming-body">
        <p className="upcoming-name">{job.clientName}</p>
        <p className="upcoming-meta">{job.packageName} · {job.datetimeLabel.split('·').pop()?.trim() ?? job.locationLabel}</p>
      </div>
      <span className={`upcoming-status${pending ? ' upcoming-status--pending' : ''}`}>{job.statusLabel}</span>
    </button>
  )
}

export interface DashboardProps {
  weekDays: WeekDay[]
  todayJobRows: RecentJobRow[]
  upcomingJobs: ComingUpJobData[]
  jobs: JobWithRelations[]
  inventoryAlert: InventoryAlertData | null
  clientCount: number
}

export default function Dashboard({
  weekDays,
  todayJobRows,
  upcomingJobs,
  jobs,
  inventoryAlert,
  clientCount,
}: DashboardProps) {
  const router = useRouter()
  const weekStats = buildHomeWeekStats(jobs, weekDays)
  const todayStr = weekDays.find((d) => d.isToday)?.date ?? new Date().toISOString().split('T')[0]

  return (
    <div className="screen page-content body">
      <header className="page-header" data-tour="home">
        <div>
          <h1 className="lg">{greeting()}</h1>
          <p>{todayLabel()}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Lead pipeline"
            onClick={() => router.push('/pipeline')}
          >
            <Funnel size={18} weight="regular" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Messages"
            onClick={() => router.push('/messages')}
          >
            <ChatCircle size={18} weight="regular" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Settings"
            data-tour="settings"
            onClick={() => router.push('/settings')}
          >
            <Gear size={18} weight="regular" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="stat-grid stat-grid--dashboard">
        <div className="stat-card">
          <div className="stat-label">This week</div>
          <div className="stat-value">{weekStats.jobsThisWeek} jobs</div>
          <div className="stat-sub">{weekStats.jobsRemaining} remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Earned</div>
          <div className="stat-value">{fmt(weekStats.earnedThisWeek)}</div>
          {weekStats.earnedDeltaPct != null && (
            <div className="stat-sub">
              {weekStats.earnedDeltaPct >= 0 ? '+' : ''}
              {weekStats.earnedDeltaPct}% vs last wk
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Clients</div>
          <div className="stat-value">{clientCount}</div>
          <div className="stat-sub">on file</div>
        </div>
      </div>

      {inventoryAlert && (
        <InventoryAlertCard alert={inventoryAlert} onPress={() => router.push('/inventory')} />
      )}

      <p className="sec">This week</p>
      <div className="week-strip">
        {weekDays.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`day${day.isToday ? ' today' : ''}`}
            onClick={() => router.push(`/jobs?date=${day.date}`)}
          >
            <div className="day-name">{day.label}</div>
            <div className="day-num">{day.dayNum}</div>
            <div className={`day-dot${day.jobCount > 0 ? '' : ' hidden'}`} />
          </button>
        ))}
      </div>

      <p className="sec">Today&apos;s jobs</p>
      {todayJobRows.length === 0 ? (
        <div className="empty-state">
          <p>No jobs scheduled for today</p>
          <button type="button" className="empty-cta" onClick={() => router.push('/jobs/new')}>
            Schedule a job
          </button>
        </div>
      ) : (
        todayJobRows.map((job) => (
          <HomeJobRow key={job.id} job={job} onPress={() => router.push(`/jobs/${job.id}`)} />
        ))
      )}

      {upcomingJobs.length > 0 && (
        <>
          <p className="sec">Upcoming</p>
          {upcomingJobs.map((job) => (
            <UpcomingRow key={job.id} job={job} onPress={() => router.push(`/jobs/${job.id}`)} />
          ))}
        </>
      )}
    </div>
  )
}
