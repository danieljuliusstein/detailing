'use client'

import { useRouter } from 'next/navigation'
import { Car, Gear } from '@phosphor-icons/react'
import type { DashboardKpis, RecentJobRow, WeekDay } from '@/lib/types'
import InventorySection from '@/components/home/InventorySection'
import { fmt } from '@/lib/calculations'

interface DashboardProps {
  kpis: DashboardKpis
  recentJobs: RecentJobRow[]
  jobsToday: number
  weekDays: WeekDay[]
  dayJobs: RecentJobRow[]
  onDaySelect: (date: string) => void
  selectedDate: string
}

const statusConfig = {
  paid: { label: 'Paid', className: 'badge-paid' },
  invoiced: { label: 'Invoice sent', className: 'badge-pending' },
  overdue: { label: 'Overdue', className: 'badge-overdue' },
  completed: { label: 'Completed', className: 'badge-draft' },
  scheduled: { label: 'Scheduled', className: 'badge-scheduled' },
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

function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
      <div className="kpi-card">
        <div className="kpi-label">Revenue MTD</div>
        <div className="kpi-value positive">{fmt(kpis.revenueMtd)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Profit MTD</div>
        <div className="kpi-value positive">{fmt(kpis.profitMtd)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Outstanding</div>
        <div className={`kpi-value ${kpis.outstanding > 0 ? 'warning' : ''}`}>{fmt(kpis.outstanding)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">This week</div>
        <div className="kpi-value">{kpis.jobsThisWeek} jobs</div>
      </div>
    </div>
  )
}

function JobRow({ job, onPress }: { job: RecentJobRow; onPress: () => void }) {
  const status = statusConfig[job.status]
  return (
    <div className="card-pressable" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }} onClick={onPress}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{job.clientName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {job.package} · {job.vehicleType} · <span style={{ textTransform: 'capitalize' }}>{job.locationType}</span>
        </div>
        <span className={`badge ${status.className}`} style={{ marginTop: 5 }}>
          {job.scheduledDate && job.status === 'scheduled' ? job.scheduledDate : status.label}
        </span>
      </div>
      <div style={{ textAlign: 'right', marginLeft: 12 }}>
        <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(job.revenue)}</div>
        <div className="money money-neutral" style={{ fontSize: 11, marginTop: 2 }}>{fmt(job.profit)} profit</div>
      </div>
    </div>
  )
}

export default function Dashboard({ kpis, recentJobs, jobsToday, weekDays, dayJobs, onDaySelect, selectedDate }: DashboardProps) {
  const router = useRouter()

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{greeting()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, marginBottom: 20 }}>
            {todayLabel()} · {jobsToday} job{jobsToday !== 1 ? 's' : ''} today
          </div>
        </div>
        <button onClick={() => router.push('/settings')} aria-label="Settings" style={{
          background: 'none', border: 'none', padding: 8, cursor: 'pointer', marginTop: -4,
        }}>
          <Gear size={22} weight="regular" color="var(--text-muted)" />
        </button>
      </div>

      <KpiGrid kpis={kpis} />

      <div className="section-title">This week</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
        {weekDays.map((day) => {
          const active = selectedDate === day.date
          return (
            <div key={day.date} onClick={() => onDaySelect(day.date)} style={{
              flexShrink: 0, width: 48, textAlign: 'center', padding: '10px 6px', cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              background: active ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
              border: `0.5px solid ${day.isToday ? 'var(--green)' : active ? 'var(--border-strong)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 10, color: day.isToday ? 'var(--green)' : 'var(--text-muted)', fontWeight: day.isToday ? 600 : 400 }}>{day.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{day.dayNum}</div>
              {day.jobCount > 0 && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', margin: '4px auto 0' }} />
              )}
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
            <button onClick={() => router.push('/jobs')} style={{
              background: 'none', border: 'none', color: 'var(--green)', fontSize: 13, cursor: 'pointer', padding: '8px 0', width: '100%',
            }}>View all {dayJobs.length} jobs</button>
          )}
          <div style={{ marginBottom: 16 }} />
        </>
      )}

      <div className="section-title">Recent jobs</div>
      {recentJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <Car size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No jobs yet — tap + to add your first</div>
        </div>
      ) : (
        recentJobs.map((job) => (
          <JobRow key={job.id} job={job} onPress={() => router.push(`/jobs/${job.id}`)} />
        ))
      )}

      <InventorySection />
    </div>
  )
}
