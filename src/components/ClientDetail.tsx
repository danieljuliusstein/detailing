'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, Car, FileText, MapPin, PencilSimple, Phone, ChatText, Envelope, Trash } from '@phosphor-icons/react'
import { VehicleTypeIcon } from '@/lib/vehicle-type-icons'
import BackButton from '@/components/BackButton'
import { fmt, mapJobStatusForDisplay } from '@/lib/calculations'
import { vehicleDisplayName } from '@/lib/damage-docs'
import { JOB_STATUS_CONFIG } from '@/lib/job-status-display'
import { deleteClient } from '@/lib/api'
import { openMapsDirections } from '@/lib/maps-url'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client, JobWithRelations, Vehicle } from '@/lib/types'

interface ClientDetailProps {
  client: Client
  jobs: JobWithRelations[]
  vehicles: Vehicle[]
  totalRevenue: number
}

export default function ClientDetail({ client, jobs, vehicles, totalRevenue }: ClientDetailProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const [removing, setRemoving] = useState(false)
  const avgJob = jobs.length > 0 ? totalRevenue / jobs.length : 0

  const handleRemove = async () => {
    const parts = [
      jobs.length > 0 ? `${jobs.length} job${jobs.length === 1 ? '' : 's'}` : null,
      vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    const detail = parts.length > 0 ? ` This will permanently delete ${parts.join(' and ')}.` : ''
    const ok = await confirm({
      title: 'Remove client?',
      message: `Remove ${client.name} from your client list?${detail} This cannot be undone.`,
      confirmLabel: 'Remove client',
      cancelLabel: 'Keep client',
      destructive: true,
    })
    if (!ok) return

    setRemoving(true)
    void deleteClient(client.id).then((result) => {
      if (result.ok) {
        router.replace('/clients')
        return
      }
      setRemoving(false)
      showMessage(result.error ?? 'Could not remove this client. Try again.')
    })
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 16, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{client.name}</div>
          {client.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{client.phone}</div>}
          {client.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</div>}
          {client.address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.address}</div>}
          {client.address && (
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 8, fontSize: 12, padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => openMapsDirections(client.address!)}
            >
              <MapPin size={14} />
              Directions
            </button>
          )}
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

      <button
        type="button"
        className="btn-ghost detail-context-link detail-context-link--block"
        onClick={() => router.push('/quotes')}
        style={{ width: '100%', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <FileText size={18} aria-hidden="true" />
        View quotes
      </button>

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Vehicles
        </div>
        <button
          type="button"
          onClick={() => router.push(`/clients/${client.id}/vehicles/new`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          + Add
        </button>
      </div>
      {vehicles.length === 0 ? (
        <button
          type="button"
          className="card card-pressable"
          style={{
            textAlign: 'center',
            padding: 24,
            marginBottom: 20,
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
          }}
          onClick={() => router.push(`/clients/${client.id}/vehicles/new`)}
        >
          <Car size={28} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Add a vehicle</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Document pre-existing damage on each vehicle
          </div>
        </button>
      ) : (
        <div className="card" style={{ marginBottom: 20, padding: '4px 14px' }}>
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              className="vehicle-list-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: vehicles.indexOf(vehicle) < vehicles.length - 1 ? '1px solid var(--border)' : 'none',
                width: '100%',
                background: 'none',
                border: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'inherit',
              }}
              onClick={() => router.push(`/clients/${client.id}/vehicles/${vehicle.id}`)}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <VehicleTypeIcon type={vehicle.type} size={20} weight="duotone" color="var(--green)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{vehicleDisplayName(vehicle)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {vehicle.plate ? `${vehicle.plate} · ` : ''}
                  {vehicle.type}
                </div>
              </span>
              <CaretRight size={16} color="var(--text-dim)" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <div className="section-title">Job history</div>
      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>No jobs yet</div>
      ) : (
        jobs.map((job) => {
          const statusKey = mapJobStatusForDisplay(job)
          const status = JOB_STATUS_CONFIG[statusKey]
          return (
            <div key={job.id} className="card-pressable" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => router.push(`/jobs/${job.id}`)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{job.package?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <span className={status.className} style={{ marginTop: 5 }}>{status.label}</span>
              </div>
              <div className="money money-positive" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(job.revenue)}</div>
            </div>
          )
        })
      )}

      <button
        type="button"
        className="btn-danger"
        disabled={removing}
        onClick={handleRemove}
        style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Trash size={16} weight="regular" aria-hidden="true" />
        {removing ? 'Removing…' : 'Remove client'}
      </button>
    </div>
  )
}
