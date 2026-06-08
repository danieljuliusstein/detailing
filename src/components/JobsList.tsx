'use client'

import { useRouter } from 'next/navigation'
import { ClipboardText } from '@phosphor-icons/react'
import JobsRevenueChart from '@/components/jobs/JobsRevenueChart'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { mapJobStatusForDisplay, netProfit } from '@/lib/calculations'
import { JOB_STATUS_CONFIG } from '@/lib/job-status-display'
import type { JobWithRelations } from '@/lib/types'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function JobsList({ jobs }: { jobs: JobWithRelations[] }) {
  const router = useRouter()

  return (
    <div className="screen page-content">
      <JobsRevenueChart jobs={jobs} />

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <ClipboardText size={40} weight="duotone" color="var(--text-dim)" aria-hidden="true" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No jobs yet</div>
        </div>
      ) : (
        <div className="jobs-list-cards">
          {jobs.map((job) => {
            const status = JOB_STATUS_CONFIG[mapJobStatusForDisplay(job)]
            const profit = netProfit(job)
            const subtitle = `${capitalize(job.vehicle_type)} • ${capitalize(job.location_type)} · ${new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

            return (
              <div
                key={job.id}
                className="card-pressable dashboard-job-card dashboard-job-card--compact"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <div className="dashboard-job-card__main">
                  <div className="dashboard-job-card__name">{job.client?.name ?? 'Unknown'}</div>
                  <div className="dashboard-job-card__meta">{subtitle}</div>
                  <span className={status.className}>{status.label}</span>
                </div>
                <div className="dashboard-job-card__figures">
                  <CurrencyAmount value={job.revenue} variant="revenue" className="dashboard-job-card__revenue" />
                  <div className="dashboard-job-card__profit">
                    <CurrencyAmount value={profit} variant="profit" /> profit
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
