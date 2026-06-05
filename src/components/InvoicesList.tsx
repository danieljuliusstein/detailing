'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt } from '@phosphor-icons/react'
import { fmt } from '@/lib/calculations'
import type { Client, Invoice } from '@/lib/types'

const statusBadge: Record<string, string> = {
  paid: 'badge-paid',
  sent: 'badge-pending',
  partial: 'badge-pending',
  draft: 'badge-draft',
  overdue: 'badge-overdue',
}

interface Props {
  invoices: Invoice[]
  clients: Client[]
}

export default function InvoicesList({ invoices, clients }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'open' | 'paid'>('all')

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  const filtered = useMemo(() => {
    if (filter === 'paid') return invoices.filter((i) => i.status === 'paid')
    if (filter === 'open') return invoices.filter((i) => i.status !== 'paid')
    return invoices
  }, [invoices, filter])

  return (
    <div className="screen page-content">
      <div style={{ paddingTop: 16, paddingBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Invoices</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{invoices.length} total</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'open', 'paid'] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setFilter(f)}
            style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
          >
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Paid'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <Receipt size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No invoices found</div>
        </div>
      ) : (
        filtered.map((inv) => {
          const client = clientMap.get(inv.client_id)
          return (
            <div
              key={inv.id}
              className="card-pressable"
              style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => router.push(`/jobs/${inv.job_id}/invoice`)}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.invoice_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {client?.name ?? 'Unknown client'}
                </div>
                <span className={`badge ${statusBadge[inv.status] ?? 'badge-draft'}`} style={{ marginTop: 6 }}>
                  {inv.status}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(inv.total)}</div>
                {inv.balance_due > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 2 }}>{fmt(inv.balance_due)} due</div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
