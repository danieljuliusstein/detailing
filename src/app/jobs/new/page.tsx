'use client'

import { useEffect, useState } from 'react'
import QuickAddJob from '@/components/QuickAddJob'
import { createJob, getPackages, getRecentClients } from '@/lib/api'
import type { Client, Package } from '@/lib/types'

export default function NewJobPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([getPackages(), getRecentClients()]).then(([pkgs, cls]) => {
      setPackages(pkgs)
      setClients(cls)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <QuickAddJob
      packages={packages}
      recentClients={clients}
      onSave={async (data) => {
        const job = await createJob(data)
        return { id: job.id }
      }}
    />
  )
}
