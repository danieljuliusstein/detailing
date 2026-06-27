'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { createVehicle, updateVehicle } from '@/lib/api'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
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
  const formRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [make, model, year, plate, vin, color])

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

      <div ref={formRef} className="page-form-card page-form">
        <FloatingField id="vehicle-year" label="Year" filled={year.trim().length > 0} optional>
          <input
            id="vehicle-year"
            className={`f-input${year.trim() ? ' hv' : ''}`}
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="vehicle-make" label="Make" filled={make.trim().length > 0}>
          <input
            id="vehicle-make"
            className={`f-input${make.trim() ? ' hv' : ''}`}
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="vehicle-model" label="Model" filled={model.trim().length > 0}>
          <input
            id="vehicle-model"
            className={`f-input${model.trim() ? ' hv' : ''}`}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="vehicle-plate" label="Plate" filled={plate.trim().length > 0} optional>
          <input
            id="vehicle-plate"
            className={`f-input${plate.trim() ? ' hv' : ''}`}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="vehicle-vin" label="VIN" filled={vin.trim().length > 0} optional>
          <input
            id="vehicle-vin"
            className={`f-input${vin.trim() ? ' hv' : ''}`}
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="vehicle-color" label="Color" filled={color.trim().length > 0} optional>
          <input
            id="vehicle-color"
            className={`f-input${color.trim() ? ' hv' : ''}`}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Color swatch</div>
          <VehicleColorSwatchPicker value={colorHex} onChange={setColorHex} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Type</div>
          <VehicleTypePicker value={type} onChange={setType} />
        </div>
      </div>

      {error ? <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
          ready={make.trim().length > 0 && model.trim().length > 0}
          disabled={saving}
          onClick={() => void handleSave()}
        />
      </div>
    </div>
  )
}
