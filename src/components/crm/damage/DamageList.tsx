'use client'

import { Plus } from '@phosphor-icons/react'
import DamageEmptyState from '@/components/crm/damage/DamageEmptyState'
import DamageListRow from '@/components/crm/damage/DamageListRow'
import type { DamageRecord } from '@/lib/types'

interface DamageListProps {
  damages: DamageRecord[]
  onAdd: () => void
  onOpen: (damageId: string) => void
}

export default function DamageList({ damages, onAdd, onOpen }: DamageListProps) {
  if (damages.length === 0) {
    return <DamageEmptyState onAdd={onAdd} />
  }

  return (
    <div className="card card--flush">
      {damages.map((damage) => (
        <DamageListRow key={damage.id} damage={damage} onPress={() => onOpen(damage.id)} />
      ))}
      <div style={{ padding: '10px 0' }}>
        <button type="button" className="ghost-btn" onClick={onAdd}>
          <Plus size={16} weight="bold" color="var(--dmg-grn)" aria-hidden="true" />
          Add damage documentation
        </button>
      </div>
    </div>
  )
}
