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
  followup: 'clients-avatar--followup',
  new: 'clients-avatar--new',
  vip: 'clients-avatar--vip',
  default: 'clients-avatar--default',
} as const

interface ClientCardProps {
  client: ClientWithStats
  derived: ClientDerived
}

export default function ClientCard({ client, derived }: ClientCardProps) {
  const router = useRouter()
  const avatarClass =
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

  const secondaryLine = client.phone || client.email || null

  const openDetail = () => router.push(`/clients/${client.id}`)

  return (
    <div className="clients-card">
      <div className="clients-card-body">
        <button type="button" className="clients-card-main" onClick={openDetail}>
          <div className={`clients-avatar ${avatarClass}`}>{derived.initials}</div>
          <div className="clients-card-center">
            <div className="clients-name-row">
              <span className="clients-name">{client.name}</span>
              {derived.isVip && (
                <span className="clients-badge clients-badge--vip">VIP</span>
              )}
              {derived.tag && (
                <span className={`clients-badge clients-badge--${derived.tag}`}>
                  {TAG_LABELS[derived.tag]}
                </span>
              )}
            </div>
            <div className="clients-last-service">{lastServiceLine}</div>
            {secondaryLine && (
              <div className="clients-contact-line">{secondaryLine}</div>
            )}
          </div>
          <div className="clients-card-right">
            <CurrencyAmount value={client.totalRevenue} variant="revenue" className="clients-lifetime" />
            <div className="clients-job-count">
              {client.jobCount} job{client.jobCount !== 1 ? 's' : ''}
            </div>
          </div>
        </button>
        <ClientCardMenu client={client} />
      </div>
    </div>
  )
}
