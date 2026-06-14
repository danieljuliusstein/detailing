'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, ClipboardText, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  filterJobsList,
  groupJobsByPeriod,
  jobListIconTone,
  jobListRightTime,
  jobListStatusClass,
  jobListStatusLabel,
  type JobsListFilter,
} from '@/lib/jobs-list-logic'
import type { JobWithRelations } from '@/lib/types'

const FILTER_CHIPS: { key: JobsListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In progress' },
]

const VISIBLE_PER_SECTION = 4

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function JobsList({ jobs }: { jobs: JobWithRelations[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<JobsListFilter>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => filterJobsList(jobs, search, chip), [jobs, search, chip])
  const sections = useMemo(() => groupJobsByPeriod(filtered), [filtered])

  const periodLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="screen page-content body">
      <header className="page-header">
        <div>
          <h1>Jobs</h1>
          <p>
            {jobs.length} total · {periodLabel}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn green"
          aria-label="Add job"
          onClick={() => router.push('/jobs/new')}
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="search">
        <MagnifyingGlass size={16} aria-hidden="true" />
        <input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search jobs"
        />
      </div>

      <div className="chips">
        {FILTER_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip${chip === c.key ? ' active' : ''}`}
            onClick={() => setChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <div className="empty-state">
          <ClipboardText size={26} weight="duotone" aria-hidden="true" />
          <p>No jobs found</p>
          <button type="button" className="empty-cta" onClick={() => router.push('/jobs/new')}>
            Add a job
          </button>
        </div>
      ) : (
        sections.map((section) => {
          const isExpanded = expanded[section.key]
          const visible = isExpanded ? section.jobs : section.jobs.slice(0, VISIBLE_PER_SECTION)
          const hidden = section.jobs.length - visible.length

          return (
            <div key={section.key}>
              <p className="sec">{section.label}</p>
              {visible.map((job) => {
                const tone = jobListIconTone(job)
                const subtitle = `${job.package?.name ?? 'Service'} · ${capitalize(job.vehicle_type)} · ${capitalize(job.location_type)}`

                return (
                  <div
                    key={job.id}
                    className="job-card"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/jobs/${job.id}`)}
                  >
                    <div className={`job-icon ${tone}`}>
                      <Car size={16} weight="duotone" aria-hidden="true" />
                    </div>
                    <div className="job-body">
                      <div className="job-name">{job.client?.name ?? 'Unknown'}</div>
                      <div className="job-meta">{subtitle}</div>
                      <span className={jobListStatusClass(job)}>{jobListStatusLabel(job)}</span>
                    </div>
                    <div className="job-right">
                      <CurrencyAmount value={job.revenue} variant="revenue" className="job-amount" />
                      <div className="job-date">{jobListRightTime(job)}</div>
                    </div>
                  </div>
                )
              })}
              {hidden > 0 && (
                <button
                  type="button"
                  className="more-pill"
                  onClick={() => setExpanded((e) => ({ ...e, [section.key]: true }))}
                >
                  + {hidden} more job{hidden > 1 ? 's' : ''} {section.key === 'month' ? 'this month' : ''}
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
