'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOut, Trash } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import EquipmentStatusToggle from '@/components/inventory/EquipmentStatusToggle'
import InventoryImagePicker from '@/components/inventory/InventoryImagePicker'
import { fmtDetailed } from '@/lib/calculations'
import type { BusinessExpense, Equipment, EquipmentAddOptions, EquipmentInput, EquipmentStatus } from '@/lib/types'

export type EquipmentSheetMode = 'add' | 'edit'

interface EquipmentEditSheetProps {
  item: Equipment | null
  mode: EquipmentSheetMode
  linkedExpense?: BusinessExpense | null
  onViewExpense?: () => void
  onSaveAdd: (input: EquipmentInput, options?: EquipmentAddOptions) => Promise<void>
  onSaveEdit: (id: string, input: Partial<EquipmentInput>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
}

export default function EquipmentEditSheet({
  item,
  mode,
  linkedExpense,
  onViewExpense,
  onSaveAdd,
  onSaveEdit,
  onDelete,
  onClose,
}: EquipmentEditSheetProps) {
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('active')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('already_owned')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setPurchasePrice('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      setSupplier('')
      setNotes('')
      setStatus('active')
      setImageUrl(null)
      setAcquisition('already_owned')
      return
    }
    if (!item) return
    setName(item.name)
    setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : '')
    setPurchaseDate(item.purchase_date ?? new Date().toISOString().slice(0, 10))
    setSupplier(item.supplier ?? '')
    setNotes(item.notes ?? '')
    setStatus(item.status ?? 'active')
    setImageUrl(item.image_url ?? null)
  }, [item, mode])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const includeExpense = mode === 'add' && acquisition === 'bought_new'
      const payload: EquipmentInput = {
        name: trimmed,
        purchase_price: Number(purchasePrice) || undefined,
        purchase_date: purchaseDate || undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        image_url: imageUrl ?? undefined,
      }
      if (mode === 'add') {
        const options: EquipmentAddOptions = includeExpense
          ? { logExpense: true, purchaseDate }
          : { logExpense: false }
        await onSaveAdd(payload, options)
      } else if (item) {
        await onSaveEdit(item.id, payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const saveLabel = saving ? 'Saving…' : mode === 'add' ? 'Add equipment' : 'Save changes'

  return (
    <BottomSheet
      title={mode === 'add' ? 'Add equipment' : item?.name ?? 'Edit equipment'}
      subtitle={mode === 'add' ? 'New durable tool or machine' : 'Update equipment details'}
      sheetClassName="inv-sheet--form inv-sheet--equipment"
      onClose={onClose}
      footer={
        <div className="inv-sheet-actions inv-sheet-actions--split">
          {mode === 'edit' && item && onDelete ? (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={() => onDelete(item.id)}
              aria-label="Delete equipment"
              style={{ gridColumn: '1 / -1' }}
            >
              <Trash size={18} weight="bold" color="#f87171" />
            </button>
          ) : null}
          <button type="button" className="inv-sheet-save" onClick={handleSave} disabled={saving}>
            {saveLabel}
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="inv-sheet-body equipment-sheet">
        <div className="inv-sheet-section">
          <InventoryImagePicker imageUrl={imageUrl} onChange={setImageUrl} />
        </div>

        {mode === 'edit' && linkedExpense && onViewExpense && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <div className="inv-expense-link-panel">
                <p className="inv-expense-link-panel__title">Logged in business expenses</p>
                <p className="inv-expense-link-panel__meta">
                  {fmtDetailed(linkedExpense.amount)} · {linkedExpense.date}
                  {linkedExpense.vendor ? ` · ${linkedExpense.vendor}` : ''}
                </p>
                <button type="button" className="inv-expense-link-panel__btn" onClick={onViewExpense}>
                  <ArrowSquareOut size={14} weight="bold" aria-hidden />
                  View expense
                </button>
              </div>
            </div>
          </>
        )}

        <div className="inv-sheet-divider" />

        <div className="inv-sheet-section">
          <div className="inv-field">
            <label className="inv-field-label" htmlFor="equipment-name">Name</label>
            <input
              id="equipment-name"
              className="inv-field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rupes DA polisher"
            />
          </div>

          {mode === 'add' && <AcquisitionToggle value={acquisition} onChange={setAcquisition} />}

          <div className="inv-field-row">
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="equipment-price">
                Purchase price
                {mode === 'add' && acquisition === 'already_owned' && (
                  <span className="inv-field-label-optional">(optional)</span>
                )}
              </label>
              <div className="inv-input-affix inv-input-affix--pre">
                <span className="inv-input-affix__pre">$</span>
                <input
                  id="equipment-price"
                  className="inv-field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="450"
                />
              </div>
            </div>
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="equipment-date">
                Purchase date
                <span className="inv-field-label-optional">(optional)</span>
              </label>
              <input
                id="equipment-date"
                className="inv-field-input"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="equipment-supplier">
              Supplier
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <input
              id="equipment-supplier"
              className="inv-field-input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Where you bought it"
            />
          </div>
        </div>

        <div className="inv-sheet-divider" />

        <div className="inv-sheet-section">
          <EquipmentStatusToggle value={status} onChange={setStatus} />

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="equipment-notes">
              Notes
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <textarea
              id="equipment-notes"
              className="inv-field-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. upgraded from entry-level DA..."
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
