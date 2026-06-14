'use client'

import { normalizeVehicleColorHex, vehicleColorDisplayHex } from '@/lib/vehicle-color'

type Props = {
  value: string
  onChange: (hex: string) => void
}

export default function VehicleColorSwatchPicker({ value, onChange }: Props) {
  const displayHex = vehicleColorDisplayHex(value)

  return (
    <div className="color-swatch-picker">
      <label className="color-swatch-picker__button" aria-label="Pick vehicle color">
        <span className="color-swatch-picker__fill" style={{ background: displayHex }} aria-hidden="true" />
        <input
          type="color"
          value={displayHex}
          onChange={(e) => onChange(normalizeVehicleColorHex(e.target.value) ?? e.target.value)}
        />
      </label>
      <input
        className="input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#1a3a6a"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  )
}
