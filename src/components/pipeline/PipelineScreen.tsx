'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Plus } from '@phosphor-icons/react'
import AuthEmptyState from '@/components/AuthEmptyState'
import BackButton from '@/components/BackButton'
import PipelineLeadCard from '@/components/pipeline/PipelineLeadCard'
import PipelineStepper from '@/components/pipeline/PipelineStepper'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { useQuickAction } from '@/providers/QuickActionContext'
import { getLeads } from '@/lib/api'
import { isLeadsCollectionMissing, LEADS_MIGRATION_BANNER } from '@/lib/api/leads-migration'
import { LEAD_STAGES } from '@/lib/lead-sources'
import type { LeadStage, LeadWithRelations } from '@/lib/types'

const STAGE_PRIORITY: LeadStage[] = ['booked', 'quoted', 'inquiry']

function firstStageWithLeads(leads: LeadWithRelations[]): LeadStage {
  for (const stage of STAGE_PRIORITY) {
    if (leads.some((l) => l.stage === stage)) return stage
  }
  return 'inquiry'
}

export default function PipelineScreen() {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const { openLeadSheet } = useQuickAction()
  const [leads, setLeads] = useState<LeadWithRelations[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [activeStage, setActiveStage] = useState<LeadStage>('inquiry')
  const [stageInitialized, setStageInitialized] = useState(false)

  const load = () => {
    getLeads()
      .then((next) => {
        setLeads(next)
        setError(null)
        setMigrationNeeded(isLeadsCollectionMissing())
      })
      .catch((e) => {
        setLeads([])
        setError(e instanceof Error ? e.message : 'Failed to load pipeline')
      })
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const onChanged = () => load()
    window.addEventListener('leads-changed', onChanged)
    return () => window.removeEventListener('leads-changed', onChanged)
  }, [])

  const grouped = useMemo(() => {
    const map: Record<LeadStage, LeadWithRelations[]> = { inquiry: [], quoted: [], booked: [] }
    for (const lead of leads ?? []) map[lead.stage].push(lead)
    return map
  }, [leads])

  useEffect(() => {
    if (!leads?.length || stageInitialized) return
    setActiveStage(firstStageWithLeads(leads))
    setStageInitialized(true)
  }, [leads, stageInitialized])

  const handleRefresh = () => {
    load()
    window.dispatchEvent(new Event('leads-changed'))
  }

  const isEmpty = (leads?.length ?? 0) === 0
  const activeLabel = LEAD_STAGES.find((s) => s.id === activeStage)?.label ?? activeStage

  return (
    <div className="screen page-content body pipeline-screen">
      <header className="pipeline-header">
        <div className="pipeline-header__back">
          <BackButton onClick={() => router.push('/')} />
        </div>
        <h1 className="pipeline-title">Lead pipeline</h1>
        <button
          type="button"
          className="pipeline-header__add"
          aria-label="New lead"
          onClick={() => (isLoggedOut ? router.push('/auth') : openLeadSheet())}
        >
          <Plus size={20} weight="bold" aria-hidden="true" />
        </button>
      </header>

      {!isEmpty && leads ? (
        <PipelineStepper
          activeStage={activeStage}
          stageCounts={{
            inquiry: grouped.inquiry.length,
            quoted: grouped.quoted.length,
            booked: grouped.booked.length,
          }}
          onStageChange={setActiveStage}
        />
      ) : null}

      {migrationNeeded ? (
        <div className="error-banner" role="status">
          {LEADS_MIGRATION_BANNER}
        </div>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}

      {!leads ? (
        <p className="pipeline-loading">Loading…</p>
      ) : isLoggedOut ? (
        <AuthEmptyState
          icon={<Car size={28} weight="duotone" />}
          title="Sign in to see your pipeline"
          subtitle="Leads and inquiries load from your account after you sign in."
        />
      ) : isEmpty ? (
        <div className="empty-card pipeline-empty-card">
          <div className="empty-card__icon">
            <Car size={24} weight="duotone" aria-hidden="true" />
          </div>
          <p className="empty-card__title">No leads yet</p>
          <p className="empty-card__subtitle">
            Add an inquiry or share your booking link to start filling your pipeline.
          </p>
          <button type="button" className="btn--new-lead" onClick={() => openLeadSheet()}>
            New lead
          </button>
        </div>
      ) : (
        <div key={activeStage} className="pipeline-stage-panel pipeline-stage-panel--animate">
          <h2 className="pipeline-stage-panel__heading">
            {activeLabel}
            <span className="pipeline-stage-panel__count">{grouped[activeStage].length}</span>
          </h2>
          {grouped[activeStage].length === 0 ? (
            <div className="pipeline-stage-panel__empty">
              <p>No leads in {activeLabel.toLowerCase()}</p>
            </div>
          ) : (
            <div className="pipeline-stage-panel__list">
              {grouped[activeStage].map((lead) => (
                <PipelineLeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={() => openLeadSheet(lead)}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
