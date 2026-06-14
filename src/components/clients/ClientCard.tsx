'use client'

import { useRouter } from 'next/navigation'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import ClientCardMenu from '@/components/clients/ClientCardMenu'
import {
  timeAgo,
  type ClientDerived,
  type ClientTag,
} from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

const TAG_LABELS: Record<Exclude<ClientTag, null>, string> = {
  followup: 'Follow up',
  new: 'New',
}

const AVATAR_CLASS = {
  followup: 'amber',
  new: 'blue',
  vip: 'green',
  default: 'gray',
} as const

interface ClientCardProps {
  client: ClientWithStats
  derived: ClientDerived
}

export default function ClientCard({ client, derived }: ClientCardProps) {
  const router = useRouter()
  const avatarTone =
    derived.tag === 'followup'
      ? AVATAR_CLASS.followup
      : derived.tag === 'new'
        ? AVATAR_CLASS.new
        : derived.isVip
          ? AVATAR_CLASS.vip
          : AVATAR_CLASS.default

  const lastServiceLine = client.lastJobDate && client.lastServiceName
    ? `${client.lastServiceName} · ${timeAgo(client.lastJobDate)}`
    : client.lastJobDate
      ? timeAgo(client.lastJobDate)
      : 'No jobs yet'

  const openDetail = () => router.push(`/clients/${client.id}`)

  return (
    <div className={`client-card${derived.isVip ? ' vip' : ''}`}>
      <button type="button" className="client-card-main" onClick={openDetail}>
        <div className={`avatar ${avatarTone}`}>{derived.initials}</div>
        <div className="client-body">
          <div className="client-name">{client.name}</div>
          <div className="client-meta">{lastServiceLine}</div>
          {(derived.isVip || derived.tag) && (
            <div className="client-tags">
              {derived.isVip && <span className="badge green">VIP</span>}
              {derived.tag && (
                <span className={`badge ${derived.tag === 'followup' ? 'amber' : 'blue'}`}>
                  {TAG_LABELS[derived.tag]}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="client-right">
          <CurrencyAmount value={client.totalRevenue} variant="revenue" className="client-amount" />
          <div className="client-jobs">
            {client.jobCount} job{client.jobCount !== 1 ? 's' : ''}
          </div>
        </div>
      </button>
      <ClientCardMenu client={client} />
    </div>
  )
}
