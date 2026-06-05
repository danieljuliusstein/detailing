'use client'

import { useRouter } from 'next/navigation'
import { PencilSimple, Phone, ChatText, Envelope } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { fmt, mapJobStatusForDisplay } from '@/lib/calculations'
import type { Client, JobWithRelations } from '@/lib/types'

const statusBadge: Record<string, string> = {
  paid: 'badge-paid', invoiced: 'badge-pending', overdue: 'badge-overdue',
  scheduled: 'badge-scheduled', completed: 'badge-draft',
}

interface ClientDetailProps {
  client: Client
  jobs: JobWithRelations[]
  totalRevenue: number
}

export default function ClientDetail({ client, jobs, totalRevenue }: ClientDetailProps) {
  const router = useRouter()
  const avgJob = jobs.length > 0 ? totalRevenue / jobs.length : 0

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 16, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{client.name}</div>
          {client.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{client.phone}</div>}
          {client.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</div>}
          {client.address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.address}</div>}
        </div>
        <button
          onClick={() => router.push(`/clients/${client.id}/edit`)}
          aria-label="Edit client"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <PencilSimple size={20} color="var(--text-muted)" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {client.phone && (
          <a href={`tel:${client.phone}`} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', textDecoration: 'none' }}>
            <Phone size={20} color="var(--text-secondary)" /><span style={{ fontSize: 11 }}>Call</span>
          </a>
        )}
        {client.phone && (
          <a href={`sms:${client.phone}`} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', textDecoration: 'none' }}>
            <ChatText size={20} color="var(--text-secondary)" /><span style={{ fontSize: 11 }}>Text</span>
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', textDecoration: 'none' }}>
            <Envelope size={20} color="var(--text-secondary)" /><span style={{ fontSize: 11 }}>Email</span>
          </a>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Total revenue', fmt(totalRevenue)],
            ['Total jobs', String(jobs.length)],
            ['Avg job', fmt(avgJob)],
            ['Lead source', client.lead_source?.replace(/_/g, ' ') ?? '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, textTransform: label === 'Lead source' ? 'capitalize' : 'none' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">Job history</div>
      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>No jobs yet</div>
      ) : (
        jobs.map((job) => {
          const status = mapJobStatusForDisplay(job)
          return (
            <div key={job.id} className="card-pressable" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => router.push(`/jobs/${job.id}`)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{job.package?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <span className={`badge ${statusBadge[status]}`} style={{ marginTop: 5 }}>{status}</span>
              </div>
              <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(job.revenue)}</div>
            </div>
          )
        })
      )}
    </div>
  )
}
