'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyInput, SupplyKind } from '@/lib/types'

export type SupplySheetMode = 'add' | 'edit' | 'restock'

interface SupplyEditSheetProps {
  supply: Supply | null
  kind: SupplyKind
  mode: SupplySheetMode
  onSaveAdd: (input: SupplyInput) => Promise<void>
  onSaveEdit: (id: string, input: Partial<SupplyInput>) => Promise<void>
  onRestock: (id: string, quantity: number, totalCost: number) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
  onModeChange?: (mode: SupplySheetMode) => void
}

export default function SupplyEditSheet({
  supply,
  kind,
  mode,
  onSaveAdd,
  onSaveEdit,
  onRestock,
  onDelete,
  onClose,
  onModeChange,
}: SupplyEditSheetProps) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState(kind === 'consumable' ? 'each' : 'oz')
  const [qty, setQty] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [reorderAt, setReorderAt] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setUnit(kind === 'consumable' ? 'each' : 'oz')
      setQty('')
      setTotalCost('')
      setReorderAt('')
      setSupplier('')
      setNotes('')
      return
    }
    if (!supply) return
    setName(supply.name)
    setUnit(supply.unit)
    setReorderAt(supply.reorder_threshold != null ? String(supply.reorder_threshold) : '')
    setSupplier(supply.supplier ?? '')
    setNotes(supply.notes ?? '')
    setRestockQty('')
    setRestockCost('')
  }, [supply, mode, kind])

  const computedCostPerUnit = useMemo(() => {
    const q = Number(qty)
    const c = Number(totalCost)
    if (mode !== 'add' || !q || !c) return 0
    return costPerUnitFromPurchase(q, c)
  }, [mode, qty, totalCost])

  const restockCostPerUnit = useMemo(() => {
    const q = Number(restockQty)
    const c = Number(restockCost)
    if (mode !== 'restock' || !q || !c) return 0
    return costPerUnitFromPurchase(q, c)
  }, [mode, restockQty, restockCost])

  const title =
    mode === 'add'
      ? `Add ${kind === 'chemical' ? 'chemical' : 'supply'}`
      : mode === 'restock'
        ? `Restock ${supply?.name ?? ''}`
        : supply?.name ?? 'Edit item'

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'add') {
        const trimmed = name.trim()
        const quantity = Number(qty)
        if (!trimmed || !quantity) return
        await onSaveAdd({
          name: trimmed,
          unit: unit.trim() || 'oz',
          quantity_on_hand: quantity,
          reorder_threshold: Number(reorderAt) || undefined,
          cost_per_unit: computedCostPerUnit || undefined,
          supplier: supplier.trim() || undefined,
          kind,
          notes: notes.trim() || undefined,
        })
      } else if (mode === 'edit' && supply) {
        await onSaveEdit(supply.id, {
          name: name.trim(),
          unit: unit.trim() || supply.unit,
          reorder_threshold: Number(reorderAt) || undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        })
      } else if (mode === 'restock' && supply) {
        const quantity = Number(restockQty)
        const cost = Number(restockCost)
        if (!quantity || quantity <= 0) return
        await onRestock(supply.id, quantity, cost > 0 ? cost : 0)
      }
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
        <div className="inv-sheet-title">{title}</div>
        <div className="inv-sheet-subtitle">
          {mode === 'add' && 'New catalog item — purchase cost auto-calculates per unit'}
          {mode === 'edit' && 'Update details — use Restock to add inventory'}
          {mode === 'restock' && 'Add stock from a purchase — updates qty and cost/unit'}
        </div>

        {supply && mode !== 'add' && onModeChange && (
          <div className="inv-status-toggle" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`inv-status-btn${mode === 'edit' ? ' inv-status-btn--ok' : ''}`}
              onClick={() => onModeChange('edit')}
            >
              Details
            </button>
            <button
              type="button"
              className={`inv-status-btn${mode === 'restock' ? ' inv-status-btn--low' : ''}`}
              onClick={() => onModeChange('restock')}
            >
              Restock
            </button>
          </div>
        )}

        {mode !== 'restock' && (
          <>
            <label className="inv-field-label">NAME</label>
            <input
              className="inv-field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
            />

            <label className="inv-field-label">UNIT</label>
            <input
              className="inv-field-input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={kind === 'consumable' ? 'each' : 'oz'}
            />
          </>
        )}

        {mode === 'add' && (
          <>
            <label className="inv-field-label">INITIAL QUANTITY</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 128"
            />

            <label className="inv-field-label">TOTAL PAID ($)</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step="0.01"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="e.g. 19.20"
            />

            {computedCostPerUnit > 0 && (
              <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 12 }}>
                Cost per {unit || 'unit'}: {fmtDetailed(computedCostPerUnit)}
              </div>
            )}
          </>
        )}

        {mode === 'restock' && supply && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              On hand: {supply.quantity_on_hand} {supply.unit}
              {supply.cost_per_unit ? ` · ${fmtDetailed(supply.cost_per_unit)}/${supply.unit}` : ''}
            </div>

            <label className="inv-field-label">QUANTITY ADDED</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="e.g. 128"
            />

            <label className="inv-field-label">TOTAL PAID ($)</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step="0.01"
              value={restockCost}
              onChange={(e) => setRestockCost(e.target.value)}
              placeholder="e.g. 19.20"
            />

            {restockCostPerUnit > 0 && (
              <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 12 }}>
                This purchase: {fmtDetailed(restockCostPerUnit)}/{supply.unit} (blended into stock)
              </div>
            )}
          </>
        )}

        {mode !== 'restock' && (
          <>
            <label className="inv-field-label">REORDER AT (optional)</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              value={reorderAt}
              onChange={(e) => setReorderAt(e.target.value)}
              placeholder="Low-stock alert threshold"
            />

            <label className="inv-field-label">SUPPLIER (optional)</label>
            <input
              className="inv-field-input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Where you buy it"
            />

            <label className="inv-field-label">NOTES (optional)</label>
            <textarea
              className="inv-field-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. need 1 gallon jug next order..."
            />
          </>
        )}

        <div className="inv-sheet-actions">
          {mode === 'edit' && supply && onDelete && (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={() => onDelete(supply.id)}
              aria-label="Delete item"
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
            {saving ? 'Saving…' : mode === 'add' ? 'Add to catalog' : mode === 'restock' ? 'Restock' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
