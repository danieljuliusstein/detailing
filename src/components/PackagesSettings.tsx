'use client'

import { useEffect, useRef, useState } from 'react'
import { PencilSimple, Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { createPackage, getAllPackages, updatePackage } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { CADENCE_PRESETS, cadencePresetLabel, DEFAULT_RETURN_DAYS } from '@/lib/package-cadence'
import { PACKAGE_DURATION_PRESETS, durationPresetLabel } from '@/lib/package-duration'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { Package } from '@/lib/types'

export default function PackagesSettings() {
  const goBack = useSettingsBack()
  const formRef = useRef<HTMLDivElement>(null)
  const returnDaysRef = useRef<HTMLSelectElement>(null)
  const durationRef = useRef<HTMLSelectElement>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [description, setDescription] = useState('')
  const [returnDays, setReturnDays] = useState(DEFAULT_RETURN_DAYS)
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [customDuration, setCustomDuration] = useState('')

  const load = async () => setPackages(await getAllPackages())
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!showAdd && !editingId) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(returnDaysRef.current)
    syncSelectFloatingLabel(durationRef.current)
  }, [showAdd, editingId, name, price, description, returnDays, durationMinutes, customDuration])

  const resolvedDuration = (): number => {
    if (durationMinutes === 0) {
      const custom = Number(customDuration)
      return custom > 0 ? custom : 120
    }
    return durationMinutes
  }

  const resetForm = () => {
    setName('')
    setPrice(0)
    setDescription('')
    setReturnDays(DEFAULT_RETURN_DAYS)
    setDurationMinutes(120)
    setCustomDuration('')
  }

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setName(pkg.name)
    setPrice(pkg.base_price)
    setDescription(pkg.description ?? '')
    setReturnDays(pkg.expected_return_days)
    const preset = PACKAGE_DURATION_PRESETS.find((p) => p.minutes === pkg.duration_minutes)
    if (preset) {
      setDurationMinutes(pkg.duration_minutes)
      setCustomDuration('')
    } else {
      setDurationMinutes(0)
      setCustomDuration(String(pkg.duration_minutes))
    }
    setShowAdd(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const handleToggle = async (pkg: Package) => {
    await updatePackage(pkg.id, { active: !pkg.active })
    await load()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !name.trim()) return
    await updatePackage(editingId, {
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
      expected_return_days: returnDays,
      duration_minutes: resolvedDuration(),
    })
    cancelEdit()
    await load()
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    await createPackage({
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
      expected_return_days: returnDays,
      duration_minutes: resolvedDuration(),
      active: true,
    })
    setShowAdd(false)
    resetForm()
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={goBack} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Services &amp; pricing</div>
        <button
          onClick={() => { setShowAdd(!showAdd); cancelEdit() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Add service"
        >
          <Plus size={22} color="var(--green)" />
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Set base prices and revisit cadence for each service. Client follow-up timing and visit frequency scores use the cadence from their last booked service.
      </div>

      {(showAdd || editingId) && (
        <div ref={formRef} className="page-form-card page-form" style={{ marginBottom: 16 }}>
          <div className="section-title">{editingId ? 'Edit service' : 'New service'}</div>

          <FloatingField id="pkg-name" label="Service name" filled={name.trim().length > 0}>
            <input
              id="pkg-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingAffixField
            id="pkg-price"
            label="Price"
            filled={price > 0}
            type="number"
            min={0}
            step={1}
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          <FloatingField id="pkg-description" label="Description" filled={description.trim().length > 0} optional>
            <input
              id="pkg-description"
              className={`f-input${description.trim() ? ' hv' : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingField id="pkg-return-days" label="Expected revisit" filled={Boolean(returnDays)}>
            <select
              ref={returnDaysRef}
              id="pkg-return-days"
              className={`f-select${returnDays ? ' hv' : ''}`}
              value={returnDays}
              onChange={(e) => {
                setReturnDays(Number(e.target.value))
                syncSelectFloatingLabel(returnDaysRef.current)
              }}
            >
              {CADENCE_PRESETS.map((preset) => (
                <option key={preset.days} value={preset.days}>
                  {preset.label} — {preset.hint}
                </option>
              ))}
            </select>
          </FloatingField>

          <FloatingField id="pkg-duration" label="Booking duration" filled={Boolean(durationMinutes || customDuration)}>
            <select
              ref={durationRef}
              id="pkg-duration"
              className={`f-select${durationMinutes || customDuration ? ' hv' : ''}`}
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(Number(e.target.value))
                syncSelectFloatingLabel(durationRef.current)
              }}
            >
              {PACKAGE_DURATION_PRESETS.map((preset) => (
                <option key={preset.minutes} value={preset.minutes}>
                  {preset.label}
                </option>
              ))}
              <option value={0}>Custom</option>
            </select>
          </FloatingField>

          {durationMinutes === 0 && (
            <FloatingField id="pkg-duration-custom" label="Custom minutes" filled={customDuration.trim().length > 0}>
              <input
                id="pkg-duration-custom"
                type="number"
                min={15}
                step={15}
                className={`f-input${customDuration.trim() ? ' hv' : ''}`}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder=" "
              />
            </FloatingField>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4, marginBottom: 12, lineHeight: 1.5 }}>
            Used to block your calendar when clients book online.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => { showAdd ? setShowAdd(false) : cancelEdit() }} style={{ flex: 1 }}>
              Cancel
            </button>
            <div className="page-form-save" style={{ flex: 1, margin: 0 }}>
              <SheetSubmitButton
                label={editingId ? 'Save' : 'Add service'}
                ready={name.trim().length > 0}
                onClick={() => void (editingId ? handleSaveEdit() : handleAdd())}
              />
            </div>
          </div>
        </div>
      )}

      {packages.map((pkg) => (
        <div key={pkg.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: pkg.active ? 1 : 0.5 }}>{pkg.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {fmt(pkg.base_price)}
              {pkg.description ? ` · ${pkg.description}` : ''}
              {` · ${cadencePresetLabel(pkg.expected_return_days)}`}
              {` · ${durationPresetLabel(pkg.duration_minutes)}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className="btn-ghost"
              onClick={() => startEdit(pkg)}
              style={{ fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <PencilSimple size={14} weight="bold" />
              Edit
            </button>
            <button className="btn-ghost" onClick={() => handleToggle(pkg)} style={{ fontSize: 12, padding: '6px 12px' }}>
              {pkg.active ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
