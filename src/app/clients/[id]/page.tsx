'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ClientDetail from '@/components/ClientDetail'
import { getClient, getClientJobs, getVehiclesForClient } from '@/lib/api'
import type { Client, JobWithRelations, Vehicle } from '@/lib/types'

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<Client | null | undefined>(undefined)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    Promise.all([getClient(id), getClientJobs(id), getVehiclesForClient(id)]).then(([c, j, v]) => {
      setClient(c)
      setJobs(j)
      setVehicles(v)
    })
  }, [id])

  if (client === undefined) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  if (!client) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Client not found</div>
  }

  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  return <ClientDetail client={client} jobs={jobs} vehicles={vehicles} totalRevenue={totalRevenue} />
}
