'use client'

import { useEffect, useState } from 'react'
import JobsList from '@/components/JobsList'
import { getJobs } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithRelations[] | null>(null)

  useEffect(() => {
    getJobs().then(setJobs)
  }, [])

  if (!jobs) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return <JobsList jobs={jobs} />
}
