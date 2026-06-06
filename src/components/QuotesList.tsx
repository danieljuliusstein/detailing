'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus } from '@phosphor-icons/react'
import { fmt } from '@/lib/calculations'
import type { QuoteWithRelations } from '@/lib/types'

const statusBadge: Record<string, string> = {
  draft: 'badge-draft',
  sent: 'badge-pending',
  accepted: 'badge-paid',
  declined: 'badge-overdue',
  expired: 'badge-overdue',
}

export default function QuotesList({ quotes }: { quotes: QuoteWithRelations[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted'>('all')

  const filtered = useMemo(() => {
    if (filter === 'accepted') return quotes.filter((q) => q.status === 'accepted')
    if (filter === 'open') return quotes.filter((q) => q.status === 'draft' || q.status === 'sent')
    return quotes
  }, [quotes, filter])

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Quotes</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{quotes.length} total</div>
        </div>
        <button type="button" className="btn-primary" onClick={() => router.push('/quotes/new')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'open', 'accepted'] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setFilter(f)}
            style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
          >
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Accepted'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <FileText size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No quotes yet</div>
        </div>
      ) : (
        filtered.map((q) => (
          <div
            key={q.id}
            className="card-pressable"
            style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => router.push(`/quotes/${q.id}`)}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{q.quote_number}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {q.client?.name ?? 'Unknown'} · {q.package?.name ?? '—'}
              </div>
              <span className={`badge ${statusBadge[q.status] ?? 'badge-draft'}`} style={{ marginTop: 6 }}>
                {q.status}
              </span>
            </div>
            <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(q.subtotal)}</div>
          </div>
        ))
      )}
    </div>
  )
}
