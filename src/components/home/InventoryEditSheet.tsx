'use client'

import { useEffect, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import {
  categoryLabel,
  formatUpdatedDate,
  type HomeInventoryItem,
  type InventoryCategory,
  type InventoryStatus,
} from '@/lib/home-inventory'

interface InventoryEditSheetProps {
  item: HomeInventoryItem | null
  category: InventoryCategory
  isNew: boolean
  onSave: (data: {
    name: string
    status?: InventoryStatus
    notes: string
    priceEstimate?: number
  }) => void
  onDelete: () => void
  onClose: () => void
}

export default function InventoryEditSheet({
  item,
  category,
  isNew,
  onSave,
  onDelete,
  onClose,
}: InventoryEditSheetProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<InventoryStatus>('ok')
  const [notes, setNotes] = useState('')
  const [priceEstimate, setPriceEstimate] = useState('')

  const hasStatus = category === 'chemicals' || category === 'supplies'
  const isWishlist = category === 'wishlist'

  useEffect(() => {
    if (!item && !isNew) return
    setName(item?.name ?? '')
    setStatus(item?.status ?? 'ok')
    setNotes(item?.notes ?? '')
    setPriceEstimate(item?.priceEstimate != null ? String(item.priceEstimate) : '')
  }, [item, isNew])

  if (!item && !isNew) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      name: trimmed,
      status: hasStatus ? status : undefined,
      notes: notes.trim(),
      priceEstimate: isWishlist ? Number(priceEstimate) || 0 : undefined,
    })
  }

  const subtitle = isNew
    ? `New ${categoryLabel(category).toLowerCase()} item`
    : `${categoryLabel(category)} · last updated ${item ? formatUpdatedDate(item.updatedAt) : '—'}`

  return (
    <div className="inv-sheet-root" role="dialog" aria-modal="true">
      <button type="button" className="inv-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="inv-sheet">
        <div className="inv-sheet-handle" />
        <div className="inv-sheet-title">{isNew ? `Add ${categoryLabel(category).toLowerCase()}` : name || 'Edit item'}</div>
        <div className="inv-sheet-subtitle">{subtitle}</div>

        <label className="inv-field-label">NAME</label>
        <input
          className="inv-field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
        />

        {hasStatus && (
          <>
            <label className="inv-field-label">STATUS</label>
            <div className="inv-status-toggle">
              <button
                type="button"
                className={`inv-status-btn${status === 'ok' ? ' inv-status-btn--ok' : ''}`}
                onClick={() => setStatus('ok')}
              >
                ✓ OK
              </button>
              <button
                type="button"
                className={`inv-status-btn${status === 'low' ? ' inv-status-btn--low' : ''}`}
                onClick={() => setStatus('low')}
              >
                ⚠ LOW
              </button>
            </div>
          </>
        )}

        {isWishlist && (
          <>
            <label className="inv-field-label">PRICE</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              value={priceEstimate}
              onChange={(e) => setPriceEstimate(e.target.value)}
              placeholder="e.g. 300"
            />
          </>
        )}

        <label className="inv-field-label">NOTES (optional)</label>
        <textarea
          className="inv-field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. almost out, need 1 gallon jug..."
        />

        <div className="inv-sheet-actions">
          {!isNew && (
            <button type="button" className="inv-sheet-delete" onClick={onDelete} aria-label="Delete item">
              <Trash size={18} weight="bold" color="#f87171" />
            </button>
          )}
          <button type="button" className="inv-sheet-save inv-sheet-save--outline" onClick={handleSave}>
            {isNew ? 'Add item' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
