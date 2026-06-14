'use client'

import { WarningCircle, Plus } from '@phosphor-icons/react'

interface DamageEmptyStateProps {
  onAdd: () => void
}

export default function DamageEmptyState({ onAdd }: DamageEmptyStateProps) {
  return (
    <div className="card">
      <div className="empty-zone">
        <div className="empty-zone__icon">
          <WarningCircle size={20} weight="duotone" aria-hidden="true" />
        </div>
        <div className="empty-zone__title">No damage documented</div>
        <div className="empty-zone__sub">
          Add photos of scratches, dents, or existing wear before each job
        </div>
      </div>
      <div className="empty-zone__divider">
        <button type="button" className="ghost-btn" onClick={onAdd}>
          <Plus size={16} weight="bold" color="var(--dmg-grn)" aria-hidden="true" />
          Add damage documentation
        </button>
      </div>
    </div>
  )
}
