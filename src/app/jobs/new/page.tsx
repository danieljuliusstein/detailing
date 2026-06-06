'use client'

import { useEffect, useState } from 'react'
import QuickAddJob from '@/components/QuickAddJob'
import { createJob, getPackages, getRecentClients, getSupplies } from '@/lib/api'
import type { Client, Package, Supply } from '@/lib/types'

export default function NewJobPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([getPackages(), getSupplies(), getRecentClients()]).then(([pkgs, sups, cls]) => {
      setPackages(pkgs)
      setSupplies(sups)
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
      supplies={supplies}
      recentClients={clients}
      onSave={async (data) => {
        const job = await createJob(data)
        return { id: job.id }
      }}
    />
  )
}
