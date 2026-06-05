'use client'

import { useEffect, useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { getDashboardData, getJobsForDate } from '@/lib/api'
import type { DashboardKpis, RecentJobRow, WeekDay } from '@/lib/types'

export default function HomePage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [recentJobs, setRecentJobs] = useState<RecentJobRow[]>([])
  const [jobsToday, setJobsToday] = useState(0)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [dayJobs, setDayJobs] = useState<RecentJobRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDashboardData()
      .then((data) => {
        if (cancelled) return
        setKpis(data.kpis)
        setRecentJobs(data.recentJobs)
        setJobsToday(data.jobsToday)
        setWeekDays(data.weekDays)
        const today = data.weekDays.find((d) => d.isToday)?.date ?? data.weekDays[0]?.date ?? ''
        setSelectedDate(today)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    getJobsForDate(selectedDate).then(setDayJobs)
  }, [selectedDate])

  if (loadError) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--red)', marginBottom: 12 }}>{loadError}</div>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <Dashboard
      kpis={kpis}
      recentJobs={recentJobs}
      jobsToday={jobsToday}
      weekDays={weekDays}
      dayJobs={dayJobs}
      selectedDate={selectedDate}
      onDaySelect={setSelectedDate}
    />
  )
}
