'use client'

import { useEffect, useState } from 'react'
import QuoteForm from '@/components/QuoteForm'
import { getClients, getPackages } from '@/lib/api'
import type { Client, Package } from '@/lib/types'

export default function NewQuotePage() {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [packages, setPackages] = useState<Package[] | null>(null)

  useEffect(() => {
    Promise.all([getClients(), getPackages()]).then(([c, p]) => {
      setClients(c)
      setPackages(p)
    })
  }, [])

  if (!clients || !packages) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  return <QuoteForm clients={clients} packages={packages} />
}
