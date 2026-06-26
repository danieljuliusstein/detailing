'use client'

import { useEffect, useState } from 'react'
import ClientsList from '@/components/ClientsList'
import { getClientsWithStats } from '@/lib/api'
import type { ClientWithStats } from '@/lib/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[] | null>(null)

  useEffect(() => {
    getClientsWithStats().then(setClients)
  }, [])

  if (!clients) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  return <ClientsList clients={clients} onClientRemoved={(id) => setClients((prev) => (prev ? prev.filter((c) => c.id !== id) : prev))} />
}
