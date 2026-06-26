'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { getClients, getJobs } from '@/lib/api'
import type { Client, JobWithRelations } from '@/lib/types'
import { Car, Globe } from '@phosphor-icons/react'

type PipelineStage = 'new' | 'scheduled' | 'completed'

interface PipelineItem {
  id: string
  stage: PipelineStage
  clientName: string
  clientId: string
  jobId?: string
  packageName: string
  date?: string
  startTime?: string
  created: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildPipelineItems(clients: Client[], jobs: JobWithRelations[]): PipelineItem[] {
  const websiteClients = clients.filter((c) => c.lead_source === 'website')
  const items: PipelineItem[] = []
  const usedJobIds = new Set<string>()

  for (const client of websiteClients) {
    const clientJobs = jobs
      .filter((j) => j.client_id === client.id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))

    const activeJob =
      clientJobs.find((j) => j.status === 'scheduled' || j.status === 'in_progress') ??
      clientJobs.find((j) => j.status === 'completed')

    if (activeJob) {
      usedJobIds.add(activeJob.id)
      const stage: PipelineStage =
        activeJob.status === 'completed' ? 'completed' : 'scheduled'
      items.push({
        id: activeJob.id,
        stage,
        clientName: client.name,
        clientId: client.id,
        jobId: activeJob.id,
        packageName: activeJob.package?.name ?? 'Detail',
        date: activeJob.date,
        startTime: activeJob.start_time,
        created: client.created ?? activeJob.date,
      })
    } else {
      items.push({
        id: client.id,
        stage: 'new',
        clientName: client.name,
        clientId: client.id,
        packageName: 'Website inquiry',
        created: client.created ?? '',
      })
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  for (const job of jobs) {
    if (usedJobIds.has(job.id)) continue
    if (job.status !== 'scheduled' && job.status !== 'in_progress') continue
    if (job.date < today) continue
    const client = clients.find((c) => c.id === job.client_id)
    items.push({
      id: job.id,
      stage: 'scheduled',
      clientName: client?.name ?? 'Client',
      clientId: job.client_id,
      jobId: job.id,
      packageName: job.package?.name ?? 'Detail',
      date: job.date,
      startTime: job.start_time,
      created: job.date,
    })
  }

  return items.sort((a, b) => (b.created > a.created ? 1 : -1))
}

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'new', label: 'New leads' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
]

function PipelineCard({ item, onPress }: { item: PipelineItem; onPress: () => void }) {
  return (
    <button type="button" className="pipeline-card" onClick={onPress}>
      <div className="pipeline-card__icon">
        <Car size={16} weight="duotone" aria-hidden="true" />
      </div>
      <div className="pipeline-card__body">
        <div className="pipeline-card__name">{item.clientName}</div>
        <div className="pipeline-card__meta">
          {item.packageName}
          {item.date ? ` · ${formatDate(item.date)}` : ''}
          {item.startTime ? ` · ${item.startTime}` : ''}
        </div>
      </div>
    </button>
  )
}

export default function PipelineScreen() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<PipelineItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getClients(), getJobs()])
      .then(([clients, jobs]) => {
        if (cancelled) return
        setItems(buildPipelineItems(clients, jobs))
        setReady(true)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load pipeline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = useMemo(() => {
    const map: Record<PipelineStage, PipelineItem[]> = { new: [], scheduled: [], completed: [] }
    for (const item of items) map[item.stage].push(item)
    return map
  }, [items])

  function openItem(item: PipelineItem) {
    if (item.jobId) router.push(`/jobs/${item.jobId}`)
    else router.push(`/clients/${item.clientId}`)
  }

  return (
    <div className="screen page-content body pipeline-screen">
      <header className="page-header">
        <BackButton onClick={() => router.push('/')} />
        <div>
          <h1 className="lg">Lead pipeline</h1>
          <p>Website bookings and upcoming work</p>
        </div>
      </header>

      {error ? (
        <div className="error-banner">{error}</div>
      ) : !ready ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Globe size={32} weight="duotone" style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No website leads yet</p>
          <p className="stat-sub">Share your booking link to start filling the pipeline</p>
        </div>
      ) : (
        <div className="pipeline-columns">
          {STAGES.map((stage) => (
            <section key={stage.id} className="pipeline-column">
              <h2 className="pipeline-column__title">
                {stage.label}
                <span className="pipeline-column__count">{grouped[stage.id].length}</span>
              </h2>
              <div className="pipeline-column__list">
                {grouped[stage.id].length === 0 ? (
                  <p className="pipeline-column__empty">None</p>
                ) : (
                  grouped[stage.id].map((item) => (
                    <PipelineCard key={item.id} item={item} onPress={() => openItem(item)} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
