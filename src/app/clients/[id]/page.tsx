'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ClientDetail from '@/components/ClientDetail'
import { getClient, getClientJobs } from '@/lib/api'
import type { Client, JobWithRelations } from '@/lib/types'

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<Client | null | undefined>(undefined)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])

  useEffect(() => {
    Promise.all([getClient(id), getClientJobs(id)]).then(([c, j]) => {
      setClient(c)
      setJobs(j)
    })
  }, [id])

  if (client === undefined) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  if (!client) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Client not found</div>
  }

  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  return <ClientDetail client={client} jobs={jobs} totalRevenue={totalRevenue} />
}
