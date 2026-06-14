'use client'

import { useEffect, useMemo, useState } from 'react'
import Dashboard from '@/components/Dashboard'
import {
  getClientsWithStats,
  getDashboardData,
  getJobs,
  getJobsForDate,
  getPackages,
  getSupplies,
} from '@/lib/api'
import { buildDerivedMap, overdueClients } from '@/lib/client-relationship-logic'
import {
  buildComingUpJob,
  buildInventoryAlert,
  buildTodayJobCard,
  pickTipInsight,
} from '@/lib/home-dashboard'
import type { ClientWithStats, RecentJobRow, WeekDay } from '@/lib/types'

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [dayJobs, setDayJobs] = useState<RecentJobRow[]>([])
  const [dueClients, setDueClients] = useState<ClientWithStats[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [todayJobRows, setTodayJobRows] = useState<RecentJobRow[]>([])
  const [allJobsLoaded, setAllJobsLoaded] = useState(false)
  const [suppliesLoaded, setSuppliesLoaded] = useState(false)
  const [packagesLoaded, setPackagesLoaded] = useState(false)
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof getJobs>>>([])
  const [supplies, setSupplies] = useState<Awaited<ReturnType<typeof getSupplies>>>([])
  const [packages, setPackages] = useState<Awaited<ReturnType<typeof getPackages>>>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([getDashboardData(), getClientsWithStats(), getJobs(), getSupplies(), getPackages()])
      .then(async ([data, clients, allJobs, supplyList, packageList]) => {
        if (cancelled) return
        setWeekDays(data.weekDays)
        setInsights(data.insights)
        setJobs(allJobs)
        setSupplies(supplyList)
        setPackages(packageList)
        setAllJobsLoaded(true)
        setSuppliesLoaded(true)
        setPackagesLoaded(true)

        const derived = buildDerivedMap(clients)
        setDueClients(overdueClients(clients, derived))

        const today = data.weekDays.find((d) => d.isToday)?.date ?? data.weekDays[0]?.date ?? ''
        setSelectedDate(today)
        if (today) {
          const rows = await getJobsForDate(today)
          if (!cancelled) setTodayJobRows(rows)
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

  useEffect(() => {
    if (!selectedDate) return
    getJobsForDate(selectedDate).then(setDayJobs)
  }, [selectedDate])

  const home = useMemo(() => {
    const todayJob = buildTodayJobCard(todayJobRows)
    const comingUp = allJobsLoaded ? buildComingUpJob(jobs) : null
    const inventoryAlert =
      suppliesLoaded && packagesLoaded ? buildInventoryAlert(todayJob, supplies, packages) : null
    const tipInsight = pickTipInsight(insights)

    return { todayJob, inventoryAlert, comingUp, tipInsight }
  }, [todayJobRows, allJobsLoaded, jobs, suppliesLoaded, packagesLoaded, supplies, packages, insights])

  if (loadError) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--red)', marginBottom: 12 }}>{loadError}</div>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <Dashboard
      weekDays={weekDays}
      dayJobs={dayJobs}
      dueClients={dueClients}
      insights={insights}
      selectedDate={selectedDate}
      onDaySelect={setSelectedDate}
      home={home}
    />
  )
}
