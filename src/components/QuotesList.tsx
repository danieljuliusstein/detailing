'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus } from '@phosphor-icons/react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import type { QuoteWithRelations } from '@/lib/types'

const FILTER_CHIPS: { key: 'all' | 'open' | 'accepted'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'accepted', label: 'Accepted' },
]

const statusBadge: Record<string, string> = {
  draft: 'badge-draft',
  sent: 'badge-pending',
  accepted: 'badge-paid',
  declined: 'badge-overdue',
  expired: 'badge-overdue',
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function QuotesList({ quotes }: { quotes: QuoteWithRelations[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted'>('all')

  const filtered = useMemo(() => {
    if (filter === 'accepted') return quotes.filter((q) => q.status === 'accepted')
    if (filter === 'open') return quotes.filter((q) => q.status === 'draft' || q.status === 'sent')
    return quotes
  }, [quotes, filter])

  const openCount = useMemo(
    () => quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length,
    [quotes]
  )

  return (
    <div className="screen page-content body quotes-screen">
      <header className="page-header">
        <div>
          <h1>Quotes</h1>
          <p>
            {quotes.length} total
            {openCount > 0 && <> · {openCount} open</>}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn green"
          aria-label="New quote"
          onClick={() => router.push('/quotes/new')}
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="chips" role="tablist" aria-label="Quote filters">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={filter === chip.key}
            className={`chip${filter === chip.key ? ' active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} weight="duotone" aria-hidden="true" />
          <p>{quotes.length === 0 ? 'No quotes yet' : 'No quotes match this filter'}</p>
          <button type="button" className="empty-cta" onClick={() => router.push('/quotes/new')}>
            Create a quote
          </button>
        </div>
      ) : (
        <div className="doc-list">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="doc-list-row card-pressable"
              onClick={() => router.push(`/quotes/${q.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/quotes/${q.id}`)}
            >
              <div className="doc-list-row__main">
                <div className="doc-list-row__title">{q.quote_number}</div>
                <div className="doc-list-row__meta">
                  {q.client?.name ?? 'Unknown'} · {q.package?.name ?? '—'}
                </div>
                <span className={`badge ${statusBadge[q.status] ?? 'badge-draft'}`}>
                  {statusLabel(q.status)}
                </span>
              </div>
              <div className="doc-list-row__amount">
                <CurrencyAmount value={q.subtotal} variant="revenue" className="doc-list-row__value" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
