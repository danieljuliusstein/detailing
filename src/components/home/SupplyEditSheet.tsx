'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyInput, SupplyKind } from '@/lib/types'

export type SupplySheetMode = 'add' | 'edit' | 'restock'

const CHEMICAL_UNITS = ['oz', 'gal', 'ml', 'L'] as const
const CONSUMABLE_UNITS = ['each', 'box', 'pack'] as const

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

function unitOptions(kind: SupplyKind): readonly string[] {
  return kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS
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
  const defaultUnit = kind === 'consumable' ? 'each' : 'oz'
  const [name, setName] = useState('')
  const [unit, setUnit] = useState(defaultUnit)
  const [onHand, setOnHand] = useState('')
  const [qty, setQty] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [reorderAt, setReorderAt] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')
  const [saving, setSaving] = useState(false)

  const activeUnit = unit.trim() || defaultUnit
  const baseUnits = unitOptions(kind)
  const units =
    supply && !baseUnits.includes(supply.unit as (typeof baseUnits)[number])
      ? [...baseUnits, supply.unit]
      : baseUnits

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setUnit(defaultUnit)
      setOnHand('')
      setQty('')
      setTotalCost('')
      setReorderAt('')
      setSupplier('')
      setNotes('')
      return
    }
    if (!supply) return
    const opts = unitOptions(kind)
    setName(supply.name)
    setUnit(opts.includes(supply.unit as (typeof opts)[number]) ? supply.unit : defaultUnit)
    setOnHand(String(supply.quantity_on_hand))
    setReorderAt(supply.reorder_threshold != null ? String(supply.reorder_threshold) : '')
    setSupplier(supply.supplier ?? '')
    setNotes(supply.notes ?? '')
    setRestockQty('')
    setRestockCost('')
  }, [supply, mode, kind, defaultUnit])

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
          unit: activeUnit,
          quantity_on_hand: quantity,
          reorder_threshold: Number(reorderAt) || undefined,
          cost_per_unit: computedCostPerUnit || undefined,
          supplier: supplier.trim() || undefined,
          kind,
          notes: notes.trim() || undefined,
        })
      } else if (mode === 'edit' && supply) {
        const quantity = Number(onHand)
        if (!Number.isFinite(quantity) || quantity < 0) return
        await onSaveEdit(supply.id, {
          name: name.trim(),
          unit: activeUnit,
          quantity_on_hand: quantity,
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

  const subtitle =
    mode === 'add'
      ? 'How you measure it, how much you have, and when to reorder'
      : mode === 'edit'
        ? 'Update stock counts and alert levels — use Restock after a purchase'
        : 'Log a purchase to add stock and update cost per unit'

  return (
    <BottomSheet
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="inv-sheet-actions inv-sheet-actions--split">
          {mode === 'edit' && supply && onDelete ? (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={() => onDelete(supply.id)}
              aria-label="Delete item"
              style={{ gridColumn: '1 / -1', width: '100%' }}
            >
              <Trash size={18} weight="bold" color="#f87171" />
            </button>
          ) : null}
          <button
            type="button"
            className="inv-sheet-save inv-sheet-save--outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add to catalog' : mode === 'restock' ? 'Restock' : 'Save changes'}
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="inv-sheet-body">
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

        {mode === 'edit' && supply && supply.cost_per_unit != null && supply.cost_per_unit > 0 && (
          <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 16 }}>
            Cost: {fmtDetailed(supply.cost_per_unit)}/{activeUnit}
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

            <label className="inv-field-label">MEASURE IN</label>
            <select
              className="inv-field-input"
              value={activeUnit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: -8, marginBottom: 12 }}>
              All amounts below use this unit ({activeUnit})
            </div>
          </>
        )}

        {mode === 'edit' && (
          <>
            <label className="inv-field-label">QUANTITY ON HAND ({activeUnit})</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step={activeUnit === 'each' ? 1 : 0.5}
              value={onHand}
              onChange={(e) => setOnHand(e.target.value)}
              placeholder={`e.g. 128 ${activeUnit}`}
            />
          </>
        )}

        {mode === 'add' && (
          <>
            <label className="inv-field-label">STARTING AMOUNT ({activeUnit})</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step={activeUnit === 'each' ? 1 : 0.5}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`e.g. 128 ${activeUnit}`}
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
                Cost per {activeUnit}: {fmtDetailed(computedCostPerUnit)}
              </div>
            )}
          </>
        )}

        {mode === 'restock' && supply && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Currently on hand: {supply.quantity_on_hand} {supply.unit}
              {supply.cost_per_unit ? ` · ${fmtDetailed(supply.cost_per_unit)}/${supply.unit}` : ''}
            </div>

            <label className="inv-field-label">ADD TO STOCK ({supply.unit})</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step={supply.unit === 'each' ? 1 : 0.5}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder={`e.g. 128 ${supply.unit}`}
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
            <label className="inv-field-label">LOW STOCK ALERT AT ({activeUnit})</label>
            <input
              className="inv-field-input"
              type="number"
              min={0}
              step={activeUnit === 'each' ? 1 : 0.5}
              value={reorderAt}
              onChange={(e) => setReorderAt(e.target.value)}
              placeholder={`e.g. 32 ${activeUnit}`}
            />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: -8, marginBottom: 12 }}>
              Shows LOW when on hand drops below this amount
            </div>

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
      </div>
    </BottomSheet>
  )
}
