'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DotsThreeVertical } from '@phosphor-icons/react'
import CreateClientConfirmSheet from '@/components/pipeline/CreateClientConfirmSheet'
import ScheduleLeadJobSheet, {
  type ScheduleLeadJobInput,
} from '@/components/pipeline/ScheduleLeadJobSheet'
import {
  convertLeadToJob,
  createQuoteForLead,
  deleteLead,
  updateLeadStage,
} from '@/lib/api'
import { leadSourceBadgeClass, leadSourceLabel, leadStageLabel } from '@/lib/lead-sources'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { LeadStage, LeadWithRelations } from '@/lib/types'

function serviceLabel(lead: LeadWithRelations): string {
  if (lead.package?.name) return lead.package.name
  if (lead.service_interest) return lead.service_interest
  return 'Service TBD'
}

function LeadCardMenu({
  lead,
  onMove,
  onEdit,
  onDelete,
}: {
  lead: LeadWithRelations
  onMove: (stage: LeadStage) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const otherStages = (['inquiry', 'quoted', 'booked'] as const).filter((s) => s !== lead.stage)

  return (
    <div className="pipeline-card-menu" ref={rootRef}>
      <button
        type="button"
        className="pipeline-card-menu__trigger"
        aria-label={`Actions for ${lead.name}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
      </button>
      {open && (
        <div className="pipeline-card-menu__popover" role="menu">
          {otherStages.map((stage) => (
            <button
              key={stage}
              type="button"
              role="menuitem"
              className="pipeline-card-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onMove(stage)
              }}
            >
              Move to {leadStageLabel(stage)}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="pipeline-card-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onEdit()
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="pipeline-card-menu__item pipeline-card-menu__item--danger"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  lead: LeadWithRelations
  onEdit: () => void
  onRefresh: () => void
}

export default function PipelineLeadCard({ lead, onEdit, onRefresh }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const runCreateQuote = async () => {
    setActionLoading(true)
    try {
      const quote = await createQuoteForLead(lead.id)
      onRefresh()
      router.push(`/quotes/${quote.id}`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Could not create quote')
    } finally {
      setActionLoading(false)
      setConfirmOpen(false)
    }
  }

  const handleSendQuote = () => {
    if (lead.quote_id) {
      router.push(`/quotes/${lead.quote_id}`)
      return
    }
    if (!lead.package_id) {
      showMessage('Select a service package on this lead before sending a quote.')
      onEdit()
      return
    }
    if (!lead.client_id) {
      setConfirmOpen(true)
      return
    }
    void runCreateQuote()
  }

  const handleConvert = async (input?: ScheduleLeadJobInput) => {
    if (lead.job_id) {
      router.push(`/jobs/${lead.job_id}`)
      return
    }
    setActionLoading(true)
    try {
      const { jobId } = await convertLeadToJob(lead.id, input)
      onRefresh()
      setScheduleOpen(false)
      router.push(`/jobs/${jobId}`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Could not create job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleScheduleClick = () => {
    if (lead.job_id) {
      void handleConvert()
      return
    }
    setScheduleOpen(true)
  }

  const handleMove = async (stage: LeadStage) => {
    await updateLeadStage(lead.id, stage)
    onRefresh()
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Remove lead?',
      message: `Remove ${lead.name} from the pipeline?`,
      confirmLabel: 'Remove lead',
      cancelLabel: 'Keep lead',
      destructive: true,
    })
    if (!ok) return
    await deleteLead(lead.id)
    onRefresh()
  }

  const quoteSubtitle = lead.quote?.quote_number
    ? `${lead.quote.quote_number} · ${lead.quote.status}`
    : undefined

  return (
    <>
      <article className={`pipeline-card${actionLoading ? ' pipeline-card--busy' : ''}`}>
        <div className="pipeline-card__main">
          <div className="pipeline-card__top">
            <span className={`pipeline-source ${leadSourceBadgeClass(lead.source)}`}>
              {leadSourceLabel(lead.source)}
            </span>
            <LeadCardMenu lead={lead} onMove={handleMove} onEdit={onEdit} onDelete={handleDelete} />
          </div>
          <p className="pipeline-card__name">{lead.name}</p>
          <p className="pipeline-card__meta">
            {serviceLabel(lead)}
            {lead.vehicle_type ? ` · ${lead.vehicle_type}` : ''}
          </p>
          {lead.phone ? <p className="pipeline-card__contact">{lead.phone}</p> : null}
          {lead.quote_amount ? (
            <p className="pipeline-card__amount">${lead.quote_amount.toLocaleString()}</p>
          ) : null}
          {quoteSubtitle ? <p className="pipeline-card__quote-chip">{quoteSubtitle}</p> : null}
        </div>

        {lead.stage === 'quoted' || (lead.stage === 'inquiry' && lead.package_id) ? (
          <button
            type="button"
            className="pipeline-card__cta"
            disabled={actionLoading}
            onClick={() => void handleSendQuote()}
          >
            {actionLoading ? 'Creating quote…' : lead.quote_id ? 'Open quote' : 'Send quote'}
          </button>
        ) : null}

        {lead.stage === 'booked' ? (
          <button
            type="button"
            className="pipeline-card__cta pipeline-card__cta--booked"
            disabled={actionLoading}
            onClick={() => void handleScheduleClick()}
          >
            {actionLoading ? 'Scheduling…' : lead.job_id ? 'View job' : 'Schedule job'}
          </button>
        ) : null}
      </article>

      {confirmOpen && (
        <CreateClientConfirmSheet
          lead={lead}
          loading={actionLoading}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => void runCreateQuote()}
        />
      )}

      {scheduleOpen && (
        <ScheduleLeadJobSheet
          lead={lead}
          loading={actionLoading}
          onClose={() => setScheduleOpen(false)}
          onConfirm={(input) => void handleConvert(input)}
        />
      )}
    </>
  )
}
