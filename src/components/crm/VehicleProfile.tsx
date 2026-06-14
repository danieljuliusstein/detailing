'use client'

import { useRouter } from 'next/navigation'
import { PencilSimple } from '@phosphor-icons/react'
import { VehicleTypeIcon } from '@/lib/vehicle-type-icons'
import BackButton from '@/components/BackButton'
import DamageSection from '@/components/crm/damage/DamageSection'
import { pendingDamagePhotoKey, vehicleDisplayName } from '@/lib/damage-docs'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/lib/vehicle-color'
import type { DamageRecord, Vehicle } from '@/lib/types'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface VehicleProfileProps {
  clientId: string
  vehicle: Vehicle
  damages: DamageRecord[]
  sheetOpen: boolean
  onOpenSheet: () => void
  onCloseSheet: () => void
}

export default function VehicleProfile({
  clientId,
  vehicle,
  damages,
  sheetOpen,
  onOpenSheet,
  onCloseSheet,
}: VehicleProfileProps) {
  const router = useRouter()
  const title = vehicleDisplayName(vehicle)
  const paintHex = normalizeVehicleColorHex(vehicle.color_hex)

  const handlePhotoSelected = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file)
    sessionStorage.setItem(pendingDamagePhotoKey(vehicle.id), dataUrl)
    onCloseSheet()
    router.push(`/clients/${clientId}/vehicles/${vehicle.id}/damage/new`)
  }

  return (
    <div className="screen damage-docs">
      <div className="page-content" style={{ paddingTop: 16 }}>
        <div className="nav-row">
          <BackButton onClick={() => router.push(`/clients/${clientId}`)} />
          <span className="nav-row__title nav-row__title--lg" style={{ flex: 1, minWidth: 0 }}>
            {title}
          </span>
          <button
            type="button"
            className="nav-row__action"
            aria-label="Edit vehicle"
            onClick={() => router.push(`/clients/${clientId}/vehicles/${vehicle.id}/edit`)}
          >
            <PencilSimple size={18} />
          </button>
        </div>

        <div className="vehicle-hero">
          {vehicle.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehicle.photo_url} alt="" />
          ) : (
            <div
              className={`vehicle-hero__icon-wrap${paintHex ? ' vehicle-hero__icon-wrap--paint' : ''}`}
              style={paintHex ? { background: paintHex } : undefined}
            >
              <VehicleTypeIcon
                type={vehicle.type}
                size={28}
                weight="duotone"
                color={vehicleIconColorOnPaint(vehicle.color_hex)}
              />
            </div>
          )}
        </div>

        <div className="vehicle-meta">
          <div>
            <div className="meta-label">Plate</div>
            <div className="meta-value">{vehicle.plate || '—'}</div>
          </div>
          <div>
            <div className="meta-label">Type</div>
            <div className="meta-value meta-value--muted" style={{ textTransform: 'capitalize' }}>
              {vehicle.type}
            </div>
          </div>
          <div>
            <div className="meta-label">Color</div>
            <div className="meta-value meta-value--muted">
              {paintHex ? (
                <span className="color-swatch" style={{ background: paintHex }} />
              ) : null}
              {vehicle.color || '—'}
            </div>
          </div>
          <div>
            <div className="meta-label">VIN</div>
            <div className="meta-value meta-value--muted">{vehicle.vin || '—'}</div>
          </div>
        </div>

        <DamageSection
          damages={damages}
          sheetOpen={sheetOpen}
          onOpenSheet={onOpenSheet}
          onCloseSheet={onCloseSheet}
          onPhotoSelected={handlePhotoSelected}
          onOpenDamage={(damageId) =>
            router.push(`/clients/${clientId}/vehicles/${vehicle.id}/damage/${damageId}`)
          }
        />
      </div>
    </div>
  )
}
