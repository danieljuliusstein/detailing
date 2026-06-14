'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb } from '@phosphor-icons/react'
import HomeScreen, { type HomeScreenProps } from '@/components/home/HomeScreen'
import { timeAgo } from '@/lib/client-relationship-logic'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { JOB_STATUS_CONFIG, jobStatusLabel } from '@/lib/job-status-display'
import type { ClientWithStats, RecentJobRow, WeekDay } from '@/lib/types'

interface DashboardProps {
  weekDays: WeekDay[]
  dayJobs: RecentJobRow[]
  dueClients: ClientWithStats[]
  insights: string[]
  onDaySelect: (date: string) => void
  selectedDate: string
  home: Omit<HomeScreenProps, 'onStartJob'>
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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

function JobRow({ job, onPress }: { job: RecentJobRow; onPress: () => void }) {
  const status = JOB_STATUS_CONFIG[job.status]
  const subtitle = `${job.vehicleType} • ${capitalize(job.locationType)}`

  return (
    <div className="card-pressable dashboard-job-card dashboard-job-card--compact" onClick={onPress}>
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
  weekDays,
  dayJobs,
  dueClients,
  insights,
  onDaySelect,
  selectedDate,
  home,
}: DashboardProps) {
  const router = useRouter()

  const handleStartJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  return (
    <div className="screen page-content">
      <HomeScreen {...home} onStartJob={handleStartJob} />

      <div className="dashboard-legacy">
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
              <JobRow key={job.id} job={job} onPress={() => router.push(`/jobs/${job.id}`)} />
            ))}
            {dayJobs.length > 3 && (
              <button type="button" onClick={() => router.push('/jobs')} className="dashboard-view-all-btn">
                View all {dayJobs.length} jobs
              </button>
            )}
            <div style={{ marginBottom: 16 }} />
          </>
        )}

        <BusinessInsight insights={insights} />
      </div>
    </div>
  )
}
