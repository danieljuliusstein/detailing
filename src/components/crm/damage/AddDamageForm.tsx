'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraPlus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import {
  createDamageDoc,
  dataUrlToFile,
  getClientJobs,
  getVehicle,
} from '@/lib/api'
import { DAMAGE_AREA_OPTIONS, pendingDamagePhotoKey } from '@/lib/damage-docs'

interface AddDamageFormProps {
  clientId: string
  vehicleId: string
}

export default function AddDamageForm({ clientId, vehicleId }: AddDamageFormProps) {
  const router = useRouter()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [area, setArea] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [linkedJobId, setLinkedJobId] = useState('')
  const [jobOptions, setJobOptions] = useState<{ id: string; label: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [vehicleLabel, setVehicleLabel] = useState('')

  useEffect(() => {
    const key = pendingDamagePhotoKey(vehicleId)
    const stored = sessionStorage.getItem(key)
    if (stored) {
      setPhotoPreview(stored)
      sessionStorage.removeItem(key)
      void dataUrlToFile(stored).then(setPhotoFile).catch(() => {})
    }

    getVehicle(vehicleId).then((v) => {
      if (v) setVehicleLabel(`${v.year ?? ''} ${v.make} ${v.model}`.trim())
    })
    getClientJobs(clientId).then((jobs) => {
      setJobOptions(
        jobs.map((j) => ({
          id: j.id,
          label: `${j.date} · ${j.package?.name ?? 'Job'}`,
        }))
      )
    })
  }, [clientId, vehicleId])

  const activeChip = useMemo(
    () => DAMAGE_AREA_OPTIONS.find((opt) => opt === area) ?? null,
    [area]
  )

  const handleSave = async () => {
    if (!area.trim()) return
    setSaving(true)
    try {
      const capturedAt = new Date().toISOString()
      await createDamageDoc(
        {
          vehicle_id: vehicleId,
          area: area.trim(),
          note: note.trim(),
          date,
          captured_at: capturedAt,
          photo_url: photoPreview,
          linked_job_id: linkedJobId || undefined,
        },
        photoFile
      )
      router.replace(`/clients/${clientId}/vehicles/${vehicleId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen damage-docs">
      <div className="page-content" style={{ paddingTop: 16 }}>
        <div className="nav-row">
          <BackButton onClick={() => router.back()} />
          <span className="nav-row__title">Add damage</span>
        </div>

        <div className="photo-preview">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" />
          ) : (
            <CameraPlus size={32} weight="duotone" color="var(--dmg-t3)" aria-hidden="true" />
          )}
          <span className="photo-preview__label">{area || 'Tap chips to select area'}</span>
        </div>

        <div className="field-label">Area *</div>
        <div className="chip-row">
          {DAMAGE_AREA_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`chip${activeChip === opt ? ' active' : ''}`}
              onClick={() => setArea(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <input
          className="field-input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Or type custom area"
        />

        <div className="field-label">Note</div>
        <textarea
          className="field-input field-input--multiline"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe pre-existing condition…"
          rows={3}
        />

        <div className="field-label">Date</div>
        <input
          type="date"
          className="field-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="field-label">Link to job (optional)</div>
        <select
          className="field-input"
          value={linkedJobId}
          onChange={(e) => setLinkedJobId(e.target.value)}
        >
          <option value="">Select job…</option>
          {jobOptions.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>

        {vehicleLabel ? (
          <p style={{ fontSize: 11, color: 'var(--dmg-t3)', marginBottom: 12 }}>Vehicle: {vehicleLabel}</p>
        ) : null}

        <button
          type="button"
          className="btn-primary"
          disabled={saving || !area.trim()}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save documentation'}
        </button>
      </div>
    </div>
  )
}
