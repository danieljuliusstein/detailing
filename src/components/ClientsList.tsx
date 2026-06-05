'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, Plus, Users } from '@phosphor-icons/react'
import { fmt } from '@/lib/calculations'
import type { ClientWithStats } from '@/lib/types'

export default function ClientsList({ clients }: { clients: ClientWithStats[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Clients</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{clients.length} total</div>
        </div>
        <button
          onClick={() => router.push('/clients/new')}
          aria-label="Add client"
          style={{ background: 'var(--green)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Plus size={20} weight="bold" color="#071407" />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input className="input" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        <MagnifyingGlass size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <Users size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No clients found</div>
        </div>
      ) : (
        filtered.map((client) => (
          <div key={client.id} className="card-pressable" style={{ marginBottom: 8 }} onClick={() => router.push(`/clients/${client.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{client.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {[client.phone, client.email].filter(Boolean).join(' · ') || 'No contact info'}
                </div>
                {client.lead_source && (
                  <span className="badge badge-draft" style={{ marginTop: 6, textTransform: 'capitalize' }}>{client.lead_source.replace(/_/g, ' ')}</span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="money money-positive" style={{ fontSize: 14, fontWeight: 700 }}>{fmt(client.totalRevenue)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{client.jobCount} job{client.jobCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
