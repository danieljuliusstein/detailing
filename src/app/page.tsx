'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getDashboardData,
  getJobs,
  getJobsForDate,
  getPackages,
  getSupplies,
} from '@/lib/api'
import Dashboard from '@/components/Dashboard'
import {
  buildComingUpJobs,
  buildInventoryAlert,
  buildTodayJobCard,
} from '@/lib/home-dashboard'
import type { RecentJobRow, WeekDay } from '@/lib/types'

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [todayJobRows, setTodayJobRows] = useState<RecentJobRow[]>([])
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof getJobs>>>([])
  const [inventoryAlert, setInventoryAlert] = useState<ReturnType<typeof buildInventoryAlert>>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([getDashboardData(), getJobs(), getSupplies(), getPackages()])
      .then(async ([data, allJobs, supplyList, packageList]) => {
        if (cancelled) return
        setWeekDays(data.weekDays)
        setJobs(allJobs)

        const today = data.weekDays.find((d) => d.isToday)?.date ?? data.weekDays[0]?.date ?? ''
        if (today) {
          const rows = await getJobsForDate(today)
          if (!cancelled) {
            setTodayJobRows(rows)
            const todayJob = buildTodayJobCard(rows)
            setInventoryAlert(buildInventoryAlert(todayJob, supplyList, packageList))
          }
        }

        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const upcomingJobs = useMemo(() => buildComingUpJobs(jobs, 3), [jobs])

  if (loadError) {
    return (
      <div className="screen page-content body" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--red)', marginBottom: 12 }}>{loadError}</div>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="screen page-content body" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <Dashboard
      weekDays={weekDays}
      todayJobRows={todayJobRows}
      upcomingJobs={upcomingJobs}
      jobs={jobs}
      inventoryAlert={inventoryAlert}
    />
  )
}
