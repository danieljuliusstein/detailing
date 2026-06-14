'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { deleteDamageDoc, updateDamageDocNote } from '@/lib/api'
import { formatCapturedAt, formatDamageDate } from '@/lib/damage-docs'
import type { DamageRecord } from '@/lib/types'

interface DamageDetailViewProps {
  clientId: string
  vehicleId: string
  damage: DamageRecord
  photoIndex?: number
  photoTotal?: number
}

export default function DamageDetailView({
  clientId,
  vehicleId,
  damage,
  photoIndex = 1,
  photoTotal = 1,
}: DamageDetailViewProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(damage.note)
  const [busy, setBusy] = useState(false)

  const handleDelete = () => {
    if (!window.confirm('Delete this damage record? This cannot be undone.')) return
    setBusy(true)
    void deleteDamageDoc(damage.id).then((ok) => {
      if (ok) router.replace(`/clients/${clientId}/vehicles/${vehicleId}`)
      else setBusy(false)
    })
  }

  const handleSaveNote = async () => {
    setBusy(true)
    try {
      await updateDamageDocNote(damage.id, note.trim())
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen damage-docs">
      <div className="page-content" style={{ paddingTop: 16 }}>
        <div className="nav-row">
          <BackButton onClick={() => router.back()} />
          <span className="nav-row__title">Damage detail</span>
          {!editing && (
            <button type="button" className="nav-row__action" onClick={() => setEditing(true)}>
              Edit note
            </button>
          )}
        </div>

        <div className="detail-photo">
          {damage.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={damage.photo_url} alt="" />
          ) : (
            <>
              <ImageIcon size={40} weight="duotone" aria-hidden="true" />
              <span style={{ position: 'absolute', bottom: 12, fontSize: 12, color: 'var(--dmg-t3)' }}>
                No photo
              </span>
            </>
          )}
          <span className="detail-badge">Pre-existing damage</span>
          {damage.photo_url ? (
            <span className="detail-photo__count">
              {photoIndex} of {photoTotal} photo
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="field-label">Note</div>
            <textarea
              className="field-input field-input--multiline"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleSaveNote} disabled={busy}>
                Save note
              </button>
            </div>
          </div>
        ) : (
          <div className="card card--flush" style={{ padding: '0 14px', marginBottom: 14 }}>
            <div className="detail-row">
              <span className="detail-row__key">Area</span>
              <span className="detail-row__val">{damage.area}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__key">Note</span>
              <span className="detail-row__val">{damage.note || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__key">Date</span>
              <span className="detail-row__val">{formatDamageDate(damage.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__key">Captured</span>
              <span className="detail-row__val detail-row__val--muted">
                {formatCapturedAt(damage.captured_at)}
              </span>
            </div>
          </div>
        )}

        {!editing && (
          <div className="detail-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditing(true)} disabled={busy}>
              Edit note
            </button>
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
