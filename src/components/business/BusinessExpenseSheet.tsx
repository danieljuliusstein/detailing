'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOut, CaretDown, Trash } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import {
  createBusinessExpense,
  deleteBusinessExpense,
  updateBusinessExpense,
} from '@/lib/api'
import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput } from '@/lib/types'

const CATEGORIES: BusinessExpenseCategory[] = [
  'legal',
  'licensing',
  'taxes',
  'insurance',
  'vehicle',
  'marketing',
  'software',
  'equipment',
  'other',
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface BusinessExpenseSheetProps {
  expense?: BusinessExpense | null
  linkedEquipmentName?: string
  onViewEquipment?: () => void
  onClose: () => void
  onSaved?: () => void
}

export default function BusinessExpenseSheet({
  expense,
  linkedEquipmentName,
  onViewEquipment,
  onClose,
  onSaved,
}: BusinessExpenseSheetProps) {
  const isEdit = Boolean(expense)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('legal')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!expense) {
      setDate(todayIso())
      setName('')
      setAmount('')
      setCategory('legal')
      setVendor('')
      setNotes('')
      return
    }
    setDate(expense.date)
    setName(expense.name)
    setAmount(String(expense.amount))
    setCategory(expense.category ?? 'other')
    setVendor(expense.vendor ?? '')
    setNotes(expense.notes ?? '')
  }, [expense])

  const buildInput = (): BusinessExpenseInput | null => {
    const trimmed = name.trim()
    const parsed = Number(amount)
    if (!trimmed || !parsed || parsed <= 0) return null
    return {
      date,
      name: trimmed,
      amount: parsed,
      category,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    }
  }

  const handleSave = async () => {
    const input = buildInput()
    if (!input) return
    setSaving(true)
    try {
      if (isEdit && expense) {
        await updateBusinessExpense(expense.id, input)
      } else {
        await createBusinessExpense(input)
      }
      setSaved(true)
      onSaved?.()
      setTimeout(onClose, 600)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !confirm('Delete this business expense?')) return
    setSaving(true)
    try {
      await deleteBusinessExpense(expense.id)
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      title={isEdit ? 'Edit expense' : 'Log business expense'}
      subtitle="Dated one-time payment — shows in P&L for that month only"
      ariaLabel="Business expense"
      sheetClassName="inv-sheet--form"
      onClose={onClose}
      footer={
        <div className="inv-sheet-actions inv-sheet-actions--split">
          {isEdit ? (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={handleDelete}
              disabled={saving}
              aria-label="Delete expense"
              style={{ gridColumn: '1 / -1' }}
            >
              <Trash size={18} color="var(--red)" />
            </button>
          ) : null}
          <button type="button" className="inv-sheet-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log expense'}
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="inv-sheet-body">
        {isEdit && expense?.equipment_id && linkedEquipmentName && onViewEquipment && (
          <div className="inv-sheet-section">
            <div className="inv-expense-link-panel">
              <p className="inv-expense-link-panel__title">Linked inventory item</p>
              <p className="inv-expense-link-panel__meta">{linkedEquipmentName}</p>
              <button type="button" className="inv-expense-link-panel__btn" onClick={onViewEquipment}>
                <ArrowSquareOut size={14} weight="bold" aria-hidden />
                View in inventory
              </button>
            </div>
          </div>
        )}

        <div className={`inv-sheet-section${isEdit && expense?.equipment_id ? '' : ''}`}>
          <div className="inv-field-row">
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="expense-date">Date</label>
              <input
                id="expense-date"
                type="date"
                className="inv-field-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="expense-amount">Amount</label>
              <div className="inv-input-affix inv-input-affix--pre">
                <span className="inv-input-affix__pre">$</span>
                <input
                  id="expense-amount"
                  type="number"
                  inputMode="decimal"
                  className="inv-field-input"
                  placeholder="85"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="expense-name">Name</label>
            <input
              id="expense-name"
              className="inv-field-input"
              placeholder="LLC annual renewal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="expense-category">Category</label>
            <div className="inv-select-wrap">
              <select
                id="expense-category"
                className="inv-field-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessExpenseCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <CaretDown className="inv-select-wrap__icon" size={16} weight="bold" aria-hidden />
            </div>
          </div>
        </div>

        <div className="inv-sheet-divider" />

        <div className="inv-sheet-section">
          <div className="inv-field">
            <label className="inv-field-label" htmlFor="expense-vendor">
              Vendor
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <input
              id="expense-vendor"
              className="inv-field-input"
              placeholder="State filing office"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="expense-notes">
              Notes
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <textarea
              id="expense-notes"
              className="inv-field-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details..."
            />
          </div>

          {saved && <p className="inv-computed-cost">Saved</p>}
        </div>
      </div>
    </BottomSheet>
  )
}
