'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import VehicleForm from '@/components/crm/VehicleForm'
import { getVehicle } from '@/lib/api'
import type { Vehicle } from '@/lib/types'

export default function EditVehiclePage() {
  const params = useParams()
  const clientId = params.id as string
  const vehicleId = params.vehicleId as string
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)

  useEffect(() => {
    getVehicle(vehicleId).then(setVehicle)
  }, [vehicleId])

  if (vehicle === undefined) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Vehicle not found
      </div>
    )
  }

  return <VehicleForm clientId={clientId} vehicle={vehicle} />
}
