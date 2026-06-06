'use client'

import { useState } from 'react'

export interface JobExpenseDraft {
  travel_cost: number
  marketing_cost: number
  equipment_depreciation: number
}

interface JobExpensesSheetProps {
  value: JobExpenseDraft
  onSave: (value: JobExpenseDraft) => void
  onClose: () => void
}

export default function JobExpensesSheet({ value, onSave, onClose }: JobExpensesSheetProps) {
  const [travel, setTravel] = useState(String(value.travel_cost || ''))
  const [marketing, setMarketing] = useState(String(value.marketing_cost || ''))
  const [equipment, setEquipment] = useState(String(value.equipment_depreciation || ''))

  const handleSave = () => {
    onSave({
      travel_cost: Number(travel) || 0,
      marketing_cost: Number(marketing) || 0,
      equipment_depreciation: Number(equipment) || 0,
    })
    onClose()
  }

  return (
    <div className="inv-sheet-root" role="dialog" aria-modal="true" aria-label="Job expenses">
      <button type="button" className="inv-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="inv-sheet">
        <div className="inv-sheet-handle" />
        <div className="inv-sheet-title">Job expenses</div>
        <div className="inv-sheet-subtitle">Travel, marketing, and equipment for this job</div>

        <label className="inv-field-label">Travel / gas</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input money"
          value={travel}
          onChange={(e) => setTravel(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Marketing</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input money"
          value={marketing}
          onChange={(e) => setMarketing(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Equipment depreciation</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input money"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        <button type="button" className="inv-sheet-save" onClick={handleSave}>
          Done
        </button>
      </div>
    </div>
  )
}
