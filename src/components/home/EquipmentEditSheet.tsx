'use client'

import { useEffect, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import type { Equipment, EquipmentInput, EquipmentStatus } from '@/lib/types'

export type EquipmentSheetMode = 'add' | 'edit'

interface EquipmentEditSheetProps {
  item: Equipment | null
  mode: EquipmentSheetMode
  onSaveAdd: (input: EquipmentInput) => Promise<void>
  onSaveEdit: (id: string, input: Partial<EquipmentInput>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
}

export default function EquipmentEditSheet({
  item,
  mode,
  onSaveAdd,
  onSaveEdit,
  onDelete,
  onClose,
}: EquipmentEditSheetProps) {
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('active')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setPurchasePrice('')
      setPurchaseDate('')
      setSupplier('')
      setNotes('')
      setStatus('active')
      return
    }
    if (!item) return
    setName(item.name)
    setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : '')
    setPurchaseDate(item.purchase_date ?? '')
    setSupplier(item.supplier ?? '')
    setNotes(item.notes ?? '')
    setStatus(item.status ?? 'active')
  }, [item, mode])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const payload: EquipmentInput = {
        name: trimmed,
        purchase_price: Number(purchasePrice) || undefined,
        purchase_date: purchaseDate || undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      }
      if (mode === 'add') await onSaveAdd(payload)
      else if (item) await onSaveEdit(item.id, payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inv-sheet-root" role="dialog" aria-modal="true">
      <button type="button" className="inv-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="inv-sheet">
        <div className="inv-sheet-handle" />
        <div className="inv-sheet-title">
          {mode === 'add' ? 'Add equipment' : item?.name ?? 'Edit equipment'}
        </div>
        <div className="inv-sheet-subtitle">
          {mode === 'add' ? 'New durable tool or machine' : 'Update equipment details'}
        </div>

        <label className="inv-field-label">NAME</label>
        <input
          className="inv-field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rupes DA polisher"
        />

        <label className="inv-field-label">PURCHASE PRICE ($)</label>
        <input
          className="inv-field-input"
          type="number"
          min={0}
          step="0.01"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="e.g. 450"
        />

        <label className="inv-field-label">PURCHASE DATE</label>
        <input
          className="inv-field-input"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

        <label className="inv-field-label">SUPPLIER (optional)</label>
        <input
          className="inv-field-input"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Where you bought it"
        />

        <label className="inv-field-label">STATUS</label>
        <div className="inv-status-toggle">
          <button
            type="button"
            className={`inv-status-btn${status === 'active' ? ' inv-status-btn--ok' : ''}`}
            onClick={() => setStatus('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`inv-status-btn${status === 'retired' ? ' inv-status-btn--low' : ''}`}
            onClick={() => setStatus('retired')}
          >
            Retired
          </button>
        </div>

        <label className="inv-field-label">NOTES (optional)</label>
        <textarea
          className="inv-field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. upgraded from entry-level DA..."
        />

        <div className="inv-sheet-actions">
          {mode === 'edit' && item && onDelete && (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={() => onDelete(item.id)}
              aria-label="Delete equipment"
            >
              <Trash size={18} weight="bold" color="#f87171" />
            </button>
          )}
          <button
            type="button"
            className="inv-sheet-save inv-sheet-save--outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add equipment' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
