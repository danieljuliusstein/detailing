'use client'

import {
  Boat,
  Bus,
  Car,
  DotsThree,
  Jeep,
  Truck,
  type Icon as PhosphorIcon,
  type IconProps,
} from '@phosphor-icons/react'
import type { VehicleType } from '@/lib/types'

export type VehicleTypeOption = {
  id: VehicleType
  label: string
  Icon: PhosphorIcon
}

export const VEHICLE_TYPE_OPTIONS: VehicleTypeOption[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Bus },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

export function getVehicleTypeOption(type: VehicleType): VehicleTypeOption {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.id === type) ?? VEHICLE_TYPE_OPTIONS[0]
}

type VehicleTypeIconProps = Omit<IconProps, 'ref'> & {
  type: VehicleType
}

export function VehicleTypeIcon({ type, size = 28, weight = 'duotone', ...props }: VehicleTypeIconProps) {
  const { Icon } = getVehicleTypeOption(type)
  return <Icon size={size} weight={weight} aria-hidden="true" {...props} />
}

type VehicleTypePickerProps = {
  value: VehicleType
  onChange: (type: VehicleType) => void
}

export function VehicleTypePicker({ value, onChange }: VehicleTypePickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {VEHICLE_TYPE_OPTIONS.map((option) => {
        const active = value === option.id
        const { Icon } = option
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{
              background: active ? 'var(--green)' : 'var(--bg-surface)',
              border: `0.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            <Icon
              size={24}
              weight={active ? 'fill' : 'regular'}
              color={active ? '#071407' : 'var(--text-muted)'}
              style={{ margin: '0 auto' }}
              aria-hidden="true"
            />
            <div
              style={{
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? '#071407' : 'var(--text-muted)',
                marginTop: 4,
              }}
            >
              {option.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
