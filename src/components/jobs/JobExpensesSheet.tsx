'use client'

import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet'

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
    <BottomSheet
      title="Job expenses"
      subtitle="Travel, marketing, and equipment for this job"
      ariaLabel="Job expenses"
      sheetClassName="inv-sheet--form"
      onClose={onClose}
      footer={
        <div className="inv-sheet-actions inv-sheet-actions--split">
          <button type="button" className="inv-sheet-save" onClick={handleSave}>
            Done
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="inv-sheet-section">
        <div className="inv-field">
          <label className="inv-field-label" htmlFor="job-exp-travel">
            Travel / gas
          </label>
          <input
            id="job-exp-travel"
            type="number"
            inputMode="decimal"
            className="inv-field-input money"
            value={travel}
            onChange={(e) => setTravel(e.target.value)}
          />
        </div>

        <div className="inv-field">
          <label className="inv-field-label" htmlFor="job-exp-marketing">
            Marketing
          </label>
          <input
            id="job-exp-marketing"
            type="number"
            inputMode="decimal"
            className="inv-field-input money"
            value={marketing}
            onChange={(e) => setMarketing(e.target.value)}
          />
        </div>

        <div className="inv-field">
          <label className="inv-field-label" htmlFor="job-exp-equipment">
            Equipment depreciation
          </label>
          <input
            id="job-exp-equipment"
            type="number"
            inputMode="decimal"
            className="inv-field-input money"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
