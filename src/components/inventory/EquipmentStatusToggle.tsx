'use client'

import type { EquipmentStatus } from '@/lib/types'

interface Props {
  value: EquipmentStatus
  onChange: (status: EquipmentStatus) => void
}

export default function EquipmentStatusToggle({ value, onChange }: Props) {
  return (
    <div className="inv-field">
      <p className="inv-field-label">Status</p>
      <div className="inv-tog-row">
        <button
          type="button"
          className={`inv-tog${value === 'active' ? ' inv-tog--active-green' : ''}`}
          onClick={() => onChange('active')}
        >
          <span className="inv-tog__title">Active</span>
          <span className="inv-tog__sub">In use</span>
        </button>
        <button
          type="button"
          className={`inv-tog${value === 'retired' ? ' inv-tog--active-green' : ''}`}
          onClick={() => onChange('retired')}
        >
          <span className="inv-tog__title">Retired</span>
          <span className="inv-tog__sub">No longer used</span>
        </button>
      </div>
    </div>
  )
}
