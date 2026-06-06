'use client'

import { useRouter } from 'next/navigation'
import { CalendarPlus, ChatCircle, Phone } from '@phosphor-icons/react'
import { fmt } from '@/lib/calculations'
import {
  retentionColor,
  timeAgo,
  type ClientDerived,
  type ClientTag,
} from '@/lib/client-relationship-logic'
import { cadencePresetLabel } from '@/lib/package-cadence'
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
  const fillColor = retentionColor(derived.retentionScore)

  const lastServiceLine = client.lastJobDate && client.lastServiceName
    ? `${client.lastServiceName} · ${timeAgo(client.lastJobDate)}`
    : client.lastJobDate
      ? timeAgo(client.lastJobDate)
      : 'No jobs yet'

  const retentionTitle = `Based on ${client.lastServiceName ?? 'service'} cadence (${cadencePresetLabel(derived.expectedReturnDays).toLowerCase()})`

  const openDetail = () => router.push(`/clients/${client.id}`)

  return (
    <div className="clients-card">
      <button type="button" className="clients-card-body" onClick={openDetail}>
        <div className="clients-card-top">
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
          </div>
          <div className="clients-card-right">
            <div className="clients-lifetime">{fmt(client.totalRevenue)}</div>
            <div className="clients-job-count">
              {client.jobCount} job{client.jobCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="clients-retention" title={retentionTitle}>
          <span className="clients-retention-label">Visit frequency</span>
          <div className="clients-retention-track">
            <div
              className="clients-retention-fill"
              style={{ width: `${derived.retentionScore}%`, background: fillColor }}
            />
          </div>
          <span className="clients-retention-pct">{derived.retentionScore}%</span>
        </div>
      </button>

      <div className="clients-actions">
        <a
          href={client.phone ? `tel:${client.phone}` : undefined}
          className={`clients-action-btn${client.phone ? '' : ' clients-action-btn--disabled'}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!client.phone) e.preventDefault()
          }}
        >
          <Phone size={14} aria-hidden="true" />
          Call
        </a>
        <a
          href={client.phone ? `sms:${client.phone}` : undefined}
          className={`clients-action-btn${client.phone ? '' : ' clients-action-btn--disabled'}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!client.phone) e.preventDefault()
          }}
        >
          <ChatCircle size={14} aria-hidden="true" />
          Text
        </a>
        <button
          type="button"
          className="clients-action-btn clients-action-btn--primary"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/jobs/new?clientId=${client.id}`)
          }}
        >
          <CalendarPlus size={14} aria-hidden="true" />
          Book job
        </button>
      </div>
    </div>
  )
}
