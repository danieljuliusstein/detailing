'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QuoteDetail from '@/components/QuoteDetail'
import { getQuote } from '@/lib/api'
import type { QuoteWithRelations } from '@/lib/types'

export default function QuoteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [quote, setQuote] = useState<QuoteWithRelations | null>(null)

  useEffect(() => {
    getQuote(id).then(setQuote)
  }, [id])

  if (!quote) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  return <QuoteDetail quote={quote} />
}
