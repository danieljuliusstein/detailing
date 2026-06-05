'use client'

import { useRouter } from 'next/navigation'
import { ClipboardText } from '@phosphor-icons/react'
import { fmt, mapJobStatusForDisplay, netProfit } from '@/lib/calculations'
import type { JobWithRelations } from '@/lib/types'

const statusConfig = {
  paid: { label: 'Paid', className: 'badge-paid' },
  invoiced: { label: 'Invoice sent', className: 'badge-pending' },
  overdue: { label: 'Overdue', className: 'badge-overdue' },
  completed: { label: 'Completed', className: 'badge-draft' },
  scheduled: { label: 'Scheduled', className: 'badge-scheduled' },
}

export default function JobsList({ jobs }: { jobs: JobWithRelations[] }) {
  const router = useRouter()

  return (
    <div className="screen page-content">
      <div style={{ paddingTop: 16, paddingBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Jobs</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {jobs.length} total
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <ClipboardText size={40} weight="duotone" color="var(--text-dim)" aria-hidden="true" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No jobs yet</div>
        </div>
      ) : (
        jobs.map((job) => {
          const status = statusConfig[mapJobStatusForDisplay(job)]
          return (
            <div
              key={job.id}
              className="card-pressable"
              style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {job.client?.name ?? 'Unknown'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {job.package?.name ?? '—'} · {job.vehicle_type} ·{' '}
                  {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <span className={`badge ${status.className}`} style={{ marginTop: 5 }}>
                  {status.label}
                </span>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 12 }}>
                <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>
                  {fmt(job.revenue)}
                </div>
                <div className="money money-neutral" style={{ fontSize: 11, marginTop: 2 }}>
                  {fmt(netProfit(job))} profit
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
