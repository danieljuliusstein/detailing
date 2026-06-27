'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, ChatCircle, Funnel, Gear, Trophy } from '@phosphor-icons/react'
import InventoryAlertCard from '@/components/home/InventoryAlertCard'
import ProfileCompleteCard from '@/components/home/ProfileCompleteCard'
import TodayJobCard from '@/components/home/TodayJobCard'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { fmt } from '@/lib/calculations'
import { DEFAULT_BOOKING_SCHEDULE, weekdayFromIsoDate } from '@/lib/booking-availability'
import { getTimeBlocks } from '@/lib/api'
import {
  buildHomeWeekStats,
  buildTodayJobCard,
  formatStartTimeLabel,
  homeJobIconTone,
  homeJobStatusClass,
  homeJobStatusLabel,
  type ComingUpJobData,
  type InventoryAlertData,
} from '@/lib/home-dashboard'
import { openMapsDirections } from '@/lib/maps-url'
import { loadSettingsAsync } from '@/lib/settings'
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
  hasUnviewedMilestone?: boolean
}

export default function Dashboard({
  weekDays,
  todayJobRows,
  upcomingJobs,
  jobs,
  inventoryAlert,
  clientCount,
  hasUnviewedMilestone = false,
}: DashboardProps) {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const profileCompletion = useProfileCompletion()
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const weekStats = buildHomeWeekStats(jobs, weekDays)
  const todayStr = weekDays.find((d) => d.isToday)?.date ?? new Date().toISOString().split('T')[0]
  const todayJob = useMemo(() => buildTodayJobCard(todayJobRows), [todayJobRows])
  const moreTodayJobs = useMemo(
    () => (todayJob ? todayJobRows.filter((j) => j.id !== todayJob.id) : todayJobRows),
    [todayJobRows, todayJob],
  )

  useEffect(() => {
    if (weekDays.length === 0) return
    const from = weekDays[0].date
    const to = weekDays[weekDays.length - 1].date
    let cancelled = false
    void Promise.all([loadSettingsAsync(), getTimeBlocks(from, to)]).then(([settings, blocks]) => {
      if (cancelled) return
      const schedule = settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
      const blocked = new Set<string>()
      for (const day of weekDays) {
        const weekday = weekdayFromIsoDate(day.date)
        if (!schedule.work_days.includes(weekday)) blocked.add(day.date)
      }
      for (const block of blocks) {
        if (block.all_day) blocked.add(block.date)
      }
      setBlockedDates(blocked)
    })
    return () => {
      cancelled = true
    }
  }, [weekDays])

  return (
    <div className="screen page-content body">
      <header className="page-header">
        <div>
          <h1 className="lg">{greeting()}</h1>
          <p>{todayLabel()}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className={`icon-btn${hasUnviewedMilestone ? ' icon-btn--milestone' : ''}`}
            aria-label={hasUnviewedMilestone ? 'New milestone — view progress' : 'Your progress'}
            onClick={() => router.push('/settings/progress')}
          >
            <Trophy size={18} weight="regular" aria-hidden="true" />
            {hasUnviewedMilestone ? <span className="milestone-dot" aria-hidden="true" /> : null}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Lead pipeline"
            data-tour="header-pipeline"
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
            className={`icon-btn${profileCompletion && !profileCompletion.isComplete ? ' icon-btn--profile-incomplete' : ''}`}
            aria-label={
              profileCompletion && !profileCompletion.isComplete
                ? 'Complete your profile — open settings'
                : 'Settings'
            }
            data-tour="settings"
            onClick={() => router.push('/settings')}
          >
            <Gear size={18} weight="regular" aria-hidden="true" />
            {profileCompletion && !profileCompletion.isComplete ? (
              <span className="profile-dot" aria-hidden="true" />
            ) : null}
          </button>
        </div>
      </header>

      {profileCompletion && !profileCompletion.isComplete && !isLoggedOut ? (
        <ProfileCompleteCard completion={profileCompletion} />
      ) : null}

      <div data-tour="week-strip">
      <div className={`stat-grid stat-grid--dashboard${isLoggedOut ? ' stat-grid--logged-out' : ''}`}>
        <div className="stat-card">
          <div className="stat-label">This week</div>
          <div className="stat-value">{isLoggedOut ? '—' : `${weekStats.jobsThisWeek} jobs`}</div>
          <div className={`stat-sub${isLoggedOut ? ' stat-sub--sign-in' : ''}`}>
            {isLoggedOut ? 'Sign in' : `${weekStats.jobsRemaining} remaining`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Earned</div>
          <div className="stat-value">{isLoggedOut ? '—' : fmt(weekStats.earnedThisWeek)}</div>
          {isLoggedOut ? (
            <div className="stat-sub stat-sub--sign-in">Sign in</div>
          ) : weekStats.earnedDeltaPct != null ? (
            <div className="stat-sub">
              {weekStats.earnedDeltaPct >= 0 ? '+' : ''}
              {weekStats.earnedDeltaPct}% vs last wk
            </div>
          ) : null}
        </div>
        <div className="stat-card">
          <div className="stat-label">Clients</div>
          <div className="stat-value">{isLoggedOut ? '—' : clientCount}</div>
          <div className={`stat-sub${isLoggedOut ? ' stat-sub--sign-in' : ''}`}>
            {isLoggedOut ? 'Sign in' : 'on file'}
          </div>
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
            className={`day${day.isToday ? ' today' : ''}${blockedDates.has(day.date) ? ' day--blocked' : ''}`}
            onClick={() => router.push(`/jobs?date=${day.date}`)}
          >
            <div className="day-name">{day.label}</div>
            <div className="day-num">{day.dayNum}</div>
            <div className={`day-dot${day.jobCount > 0 ? '' : ' hidden'}`} />
          </button>
        ))}
      </div>
      </div>

      <div data-tour="today-jobs">
      <p className="sec">Today&apos;s jobs</p>
      <TodayJobCard
        job={todayJob}
        isLoggedOut={isLoggedOut}
        onDirections={openMapsDirections}
        onStart={(jobId) => router.push(`/jobs/${jobId}`)}
        onAddJob={() => {
          if (isLoggedOut) router.push('/auth')
          else router.push('/jobs/new')
        }}
      />
      {moreTodayJobs.map((job) => (
        <HomeJobRow key={job.id} job={job} onPress={() => router.push(`/jobs/${job.id}`)} />
      ))}
      </div>

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
