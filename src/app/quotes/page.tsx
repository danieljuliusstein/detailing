'use client'

import { useEffect, useState } from 'react'
import QuotesList from '@/components/QuotesList'
import { getQuotes } from '@/lib/api'
import type { QuoteWithRelations } from '@/lib/types'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteWithRelations[] | null>(null)

  useEffect(() => {
    getQuotes().then(setQuotes)
  }, [])

  if (!quotes) {
    return (
      <div className="screen page-content body" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return <QuotesList quotes={quotes} />
}
