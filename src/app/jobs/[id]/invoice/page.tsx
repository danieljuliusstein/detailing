'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InvoicePreview from '@/components/InvoicePreview'
import { getJob } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function InvoicePage() {
  const params = useParams()
  const id = params.id as string
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)

  useEffect(() => {
    getJob(id).then(setJob)
  }, [id])

  if (job === undefined) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  if (!job) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Job not found</div>
  }

  return <InvoicePreview job={job} />
}
