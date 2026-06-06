'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import ClientCard from '@/components/clients/ClientCard'
import { fmt } from '@/lib/calculations'
import {
  buildDerivedMap,
  filterBySegment,
  overdueClients,
  partitionForAll,
  sortForSegment,
  type ClientSegment,
} from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

const SEGMENTS: { key: ClientSegment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'followup', label: 'Follow up' },
  { key: 'top', label: 'Top' },
  { key: 'new', label: 'New' },
]

function matchesSearch(client: ClientWithStats, q: string): boolean {
  const lower = q.toLowerCase()
  return (
    client.name.toLowerCase().includes(lower) ||
    (client.phone?.includes(q) ?? false) ||
    (client.email?.toLowerCase().includes(lower) ?? false)
  )
}

export default function ClientsList({ clients }: { clients: ClientWithStats[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<ClientSegment>('all')

  const derivedMap = useMemo(() => buildDerivedMap(clients), [clients])

  const lifetimeTotal = useMemo(
    () => clients.reduce((s, c) => s + c.totalRevenue, 0),
    [clients]
  )

  const overdue = useMemo(() => overdueClients(clients, derivedMap), [clients, derivedMap])

  const filtered = useMemo(() => {
    const q = search.trim()
    let list = filterBySegment(clients, segment, derivedMap)
    list = sortForSegment(list, segment, derivedMap)
    if (q) list = list.filter((c) => matchesSearch(c, q))
    return list
  }, [clients, segment, search, derivedMap])

  const { needsAttention, rest } = useMemo(() => {
    if (segment !== 'all') return { needsAttention: [], rest: filtered }
    const q = search.trim()
    const base = q ? clients.filter((c) => matchesSearch(c, q)) : clients
    return partitionForAll(base, derivedMap)
  }, [segment, filtered, search, clients, derivedMap])

  const renderCards = (list: ClientWithStats[]) =>
    list.map((client) => {
      const derived = derivedMap.get(client.id)!
      return <ClientCard key={client.id} client={client} derived={derived} />
    })

  return (
    <div className="screen page-content clients-screen">
      <div className="clients-header">
        <div>
          <h1 className="clients-title">Clients</h1>
          <p className="clients-subtitle">
            {clients.length} client{clients.length !== 1 ? 's' : ''} · {fmt(lifetimeTotal)} lifetime
          </p>
        </div>
        <button
          type="button"
          className="clients-add-btn"
          onClick={() => router.push('/clients/new')}
          aria-label="Add client"
        >
          <Plus size={20} weight="bold" color="#111" aria-hidden="true" />
        </button>
      </div>

      {overdue.length > 0 && (
        <button
          type="button"
          className="clients-banner"
          onClick={() => setSegment('followup')}
        >
          <span className="clients-banner-dot" aria-hidden="true" />
          <span className="clients-banner-text">
            <strong>{overdue.length}</strong>
            {` client${overdue.length > 1 ? 's' : ''} due for a visit — tap to follow up`}
          </span>
        </button>
      )}

      <div className="clients-search-wrap">
        <MagnifyingGlass
          size={16}
          color="#555"
          className="clients-search-icon"
          aria-hidden="true"
        />
        <input
          className="clients-search"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="clients-segments" role="tablist" aria-label="Client filters">
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={segment === s.key}
            className={`clients-segment${segment === s.key ? ' clients-segment--active' : ''}`}
            onClick={() => setSegment(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="clients-empty">No clients found</div>
      )}

      {segment === 'all' && filtered.length > 0 && (
        <>
          {needsAttention.length > 0 && (
            <>
              <div className="clients-section-label">Needs attention</div>
              {renderCards(needsAttention)}
              <div className="clients-section-divider" />
            </>
          )}
          <div className="clients-section-label">All clients</div>
          {renderCards(rest)}
        </>
      )}

      {segment !== 'all' && filtered.length > 0 && renderCards(filtered)}
    </div>
  )
}
