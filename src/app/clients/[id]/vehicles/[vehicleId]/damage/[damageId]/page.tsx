'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DamageDetailView from '@/components/crm/damage/DamageDetailView'
import { getDamageDoc } from '@/lib/api'
import type { DamageRecord } from '@/lib/types'

export default function DamageDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const vehicleId = params.vehicleId as string
  const damageId = params.damageId as string

  const [damage, setDamage] = useState<DamageRecord | null | undefined>(undefined)

  useEffect(() => {
    getDamageDoc(damageId).then(setDamage)
  }, [damageId])

  if (damage === undefined) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!damage) {
    return (
      <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Damage record not found
      </div>
    )
  }

  return (
    <DamageDetailView
      clientId={clientId}
      vehicleId={vehicleId}
      damage={damage}
    />
  )
}
