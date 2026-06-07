'use client'

import { useEffect, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
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
  onClose: () => void
  onSaved?: () => void
}

export default function BusinessExpenseSheet({
  expense,
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
              style={{ gridColumn: '1 / -1', width: '100%' }}
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
        <label className="inv-field-label">Date</label>
        <input
          type="date"
          className="inv-field-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Name</label>
        <input
          className="inv-field-input"
          placeholder="LLC annual renewal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Amount ($)</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input money"
          placeholder="85"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Category</label>
        <select
          className="inv-field-input"
          value={category}
          onChange={(e) => setCategory(e.target.value as BusinessExpenseCategory)}
          style={{ marginBottom: 14 }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="inv-field-label">Vendor (optional)</label>
        <input
          className="inv-field-input"
          placeholder="State filing office"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Notes (optional)</label>
        <textarea
          className="inv-field-input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ marginBottom: 20, resize: 'vertical' }}
        />

        {saved && (
          <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 12 }}>Saved</div>
        )}

    </BottomSheet>
  )
}
