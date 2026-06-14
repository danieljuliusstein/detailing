'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { createVehicle, updateVehicle } from '@/lib/api'
import type { Vehicle, VehicleInput, VehicleType } from '@/lib/types'
import { VehicleTypeIcon, VehicleTypePicker } from '@/lib/vehicle-type-icons'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/lib/vehicle-color'
import VehicleColorSwatchPicker from '@/components/crm/VehicleColorSwatchPicker'

interface Props {
  clientId: string
  vehicle?: Vehicle
}

export default function VehicleForm({ clientId, vehicle }: Props) {
  const router = useRouter()
  const isEdit = !!vehicle
  const [make, setMake] = useState(vehicle?.make ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '')
  const [plate, setPlate] = useState(vehicle?.plate ?? '')
  const [vin, setVin] = useState(vehicle?.vin ?? '')
  const [color, setColor] = useState(vehicle?.color ?? '')
  const [colorHex, setColorHex] = useState(vehicle?.color_hex ?? '')
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? 'sedan')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const buildInput = (): VehicleInput => ({
    client_id: clientId,
    make: make.trim(),
    model: model.trim(),
    year: year ? Number(year) : undefined,
    plate: plate.trim() || undefined,
    vin: vin.trim() || undefined,
    color: color.trim() || undefined,
    color_hex: normalizeVehicleColorHex(colorHex),
    type,
  })

  const handleSave = async () => {
    if (!make.trim() || !model.trim()) {
      setError('Make and model are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit && vehicle) {
        const updated = await updateVehicle(vehicle.id, buildInput())
        if (!updated) throw new Error('Update failed')
        router.push(`/clients/${clientId}/vehicles/${vehicle.id}`)
      } else {
        const created = await createVehicle(buildInput())
        router.push(`/clients/${clientId}/vehicles/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600 }}>{isEdit ? 'Edit vehicle' : 'Add vehicle'}</div>
      </div>

      <div className="damage-docs">
        <div className="vehicle-hero" style={{ marginBottom: 20 }}>
          <div
            className={`vehicle-hero__icon-wrap${normalizeVehicleColorHex(colorHex) ? ' vehicle-hero__icon-wrap--paint' : ''}`}
            style={
              normalizeVehicleColorHex(colorHex)
                ? { background: normalizeVehicleColorHex(colorHex) }
                : undefined
            }
          >
            <VehicleTypeIcon
              type={type}
              size={28}
              weight="duotone"
              color={vehicleIconColorOnPaint(colorHex)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {([
          ['Year', year, setYear, 'number'],
          ['Make', make, setMake, 'text'],
          ['Model', model, setModel, 'text'],
          ['Plate', plate, setPlate, 'text'],
          ['VIN', vin, setVin, 'text'],
          ['Color', color, setColor, 'text'],
        ] as const).map(([label, value, setter, inputType]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <input
              className="input"
              type={inputType}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={label === 'Year' ? 'e.g. 2022' : undefined}
            />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Color swatch</div>
          <VehicleColorSwatchPicker value={colorHex} onChange={setColorHex} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Type</div>
          <VehicleTypePicker value={type} onChange={setType} />
        </div>
      </div>

      {error && <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>}

      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
      </button>
    </div>
  )
}
