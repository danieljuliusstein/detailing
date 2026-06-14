'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import ClientCard from '@/components/clients/ClientCard'
import FollowUpClientCard from '@/components/clients/FollowUpClientCard'
import {
  buildDerivedMap,
  filterBySegment,
  overdueClients,
  sortForSegment,
  topClientsByRevenue,
  type ClientSegment,
} from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

const SEGMENTS: { key: ClientSegment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'followup', label: 'Follow up' },
  { key: 'top', label: 'Top' },
  { key: 'new', label: 'New' },
]

const CLIENTS_VISIBLE = 5

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
  const [showAllRest, setShowAllRest] = useState(false)

  const derivedMap = useMemo(() => buildDerivedMap(clients), [clients])
  const overdue = useMemo(() => overdueClients(clients, derivedMap), [clients, derivedMap])
  const topClients = useMemo(() => topClientsByRevenue(clients, 3), [clients])

  const filtered = useMemo(() => {
    const q = search.trim()
    let list = filterBySegment(clients, segment, derivedMap)
    list = sortForSegment(list, segment, derivedMap)
    if (q) list = list.filter((c) => matchesSearch(c, q))
    return list
  }, [clients, segment, search, derivedMap])

  const allRest = useMemo(() => {
    const topIds = new Set(topClients.map((c) => c.id))
    const overdueIds = new Set(overdue.map((c) => c.id))
    return clients
      .filter((c) => !topIds.has(c.id) && !overdueIds.has(c.id))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [clients, topClients, overdue])

  const visibleRest = showAllRest ? allRest : allRest.slice(0, CLIENTS_VISIBLE)
  const hiddenRest = allRest.length - visibleRest.length

  const renderSegmentList = () =>
    filtered.map((client) => {
      const derived = derivedMap.get(client.id)!
      return <ClientCard key={client.id} client={client} derived={derived} />
    })

  return (
    <div className="screen page-content body clients-screen">
      <header className="page-header">
        <div>
          <h1>Clients</h1>
          <p>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
            {overdue.length > 0 && (
              <> · {overdue.length} need follow-up</>
            )}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn green"
          onClick={() => router.push('/clients/new')}
          aria-label="Add client"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="search">
        <MagnifyingGlass size={16} aria-hidden="true" />
        <input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search clients"
        />
      </div>

      <div className="chips" role="tablist" aria-label="Client filters">
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={segment === s.key}
            className={`chip${segment === s.key ? ' active' : ''}`}
            onClick={() => setSegment(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {segment !== 'all' ? (
        filtered.length === 0 ? (
          <div className="empty-state"><p>No clients found</p></div>
        ) : (
          renderSegmentList()
        )
      ) : (
        <>
          {overdue.length > 0 && (
            <>
              <p className="sec">Follow up</p>
              {overdue.map((client) => (
                <FollowUpClientCard key={client.id} client={client} />
              ))}
            </>
          )}

          {topClients.length > 0 && (
            <>
              <p className="sec">Top clients</p>
              {topClients.map((client) => (
                <ClientCard key={client.id} client={client} derived={derivedMap.get(client.id)!} />
              ))}
            </>
          )}

          {allRest.length > 0 && (
            <>
              <p className="sec">All clients</p>
              {visibleRest.map((client) => (
                <ClientCard key={client.id} client={client} derived={derivedMap.get(client.id)!} />
              ))}
              {hiddenRest > 0 && (
                <button type="button" className="more-pill" onClick={() => setShowAllRest(true)}>
                  + {hiddenRest} more client{hiddenRest > 1 ? 's' : ''}
                </button>
              )}
            </>
          )}

          {clients.length === 0 && (
            <div className="empty-state"><p>No clients yet</p></div>
          )}
        </>
      )}
    </div>
  )
}
