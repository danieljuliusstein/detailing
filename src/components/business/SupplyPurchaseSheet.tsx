'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { isSupplyPurchase } from '@/lib/supply-purchase-logic'
import {
  createSupplyPurchase,
  deleteSupplyPurchase,
  getSupplies,
  updateSupplyPurchase,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import type { BusinessExpense, Supply, SupplyKind, SupplyPurchaseInput } from '@/lib/types'

const CHEMICAL_UNITS = ['oz', 'gal', 'ml', 'L'] as const
const CONSUMABLE_UNITS = ['each', 'box', 'pack'] as const
const NEW_SUPPLY = '__new__'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface SupplyPurchaseSheetProps {
  expense?: BusinessExpense | null
  onClose: () => void
  onSaved?: () => void
}

export default function SupplyPurchaseSheet({
  expense,
  onClose,
  onSaved,
}: SupplyPurchaseSheetProps) {
  const isEdit = Boolean(expense)
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [date, setDate] = useState(todayIso())
  const [supplyKey, setSupplyKey] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SupplyKind>('chemical')
  const [unit, setUnit] = useState('oz')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isNewSupply = supplyKey === NEW_SUPPLY

  useEffect(() => {
    getSupplies().then((list) => {
      const purchasable = list.filter((s) => s.kind === 'chemical' || s.kind === 'consumable')
      setCatalog(purchasable)
    })
  }, [])

  useEffect(() => {
    if (!expense) {
      setDate(todayIso())
      setSupplyKey('')
      setName('')
      setKind('chemical')
      setUnit('oz')
      setQuantity('')
      setAmount('')
      setVendor('')
      setNotes('')
      return
    }
    setDate(expense.date)
    setSupplyKey(expense.supply_id ?? '')
    setName(expense.name)
    setQuantity(expense.quantity != null ? String(expense.quantity) : '')
    setAmount(String(expense.amount))
    setVendor(expense.vendor ?? '')
    setNotes(expense.notes ?? '')
    const linked = catalog.find((s) => s.id === expense.supply_id)
    if (linked) {
      setKind(linked.kind ?? 'chemical')
      setUnit(linked.unit)
    }
  }, [expense, catalog])

  useEffect(() => {
    if (isNewSupply || !supplyKey) return
    const selected = catalog.find((s) => s.id === supplyKey)
    if (selected) {
      setName(selected.name)
      setKind(selected.kind ?? 'chemical')
      setUnit(selected.unit)
    }
  }, [supplyKey, catalog, isNewSupply])

  const unitOptions = kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS

  const costPreview = useMemo(() => {
    const q = Number(quantity)
    const a = Number(amount)
    if (!q || !a) return 0
    return costPerUnitFromPurchase(q, a)
  }, [quantity, amount])

  const buildInput = (): SupplyPurchaseInput | null => {
    const trimmed = name.trim()
    const qty = Number(quantity)
    const total = Number(amount)
    if (!trimmed || !qty || qty <= 0 || !total || total <= 0) return null

    if (isEdit && expense?.supply_id) {
      return {
        date,
        name: trimmed,
        amount: total,
        quantity: qty,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      }
    }

    if (isNewSupply) {
      return {
        date,
        name: trimmed,
        amount: total,
        quantity: qty,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        new_supply: {
          name: trimmed,
          unit: unit.trim() || 'oz',
          quantity_on_hand: qty,
          kind,
          supplier: vendor.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      }
    }

    if (!supplyKey) return null
    return {
      date,
      name: trimmed,
      amount: total,
      quantity: qty,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
      supply_id: supplyKey,
    }
  }

  const handleSave = async () => {
    const input = buildInput()
    if (!input) {
      setError('Fill in supply, quantity, and total cost.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit && expense) {
        await updateSupplyPurchase(expense.id, input)
      } else {
        await createSupplyPurchase(input)
      }
      setSaved(true)
      onSaved?.()
      setTimeout(onClose, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save purchase.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !confirm('Delete this supply purchase? Inventory will be adjusted.')) return
    setSaving(true)
    setError('')
    try {
      await deleteSupplyPurchase(expense.id)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete purchase.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inv-sheet-root" role="dialog" aria-modal="true" aria-label="Buy supplies">
      <button type="button" className="inv-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="inv-sheet">
        <div className="inv-sheet-handle" />
        <div className="inv-sheet-title">{isEdit ? 'Edit supply purchase' : 'Buy supplies'}</div>
        <div className="inv-sheet-subtitle">
          Expense hits P&amp;L this month and stock is added to inventory
        </div>

        <label className="inv-field-label">Date</label>
        <input
          type="date"
          className="inv-field-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        {!isEdit && (
          <>
            <label className="inv-field-label">Supply</label>
            <select
              className="inv-field-input"
              value={supplyKey}
              onChange={(e) => setSupplyKey(e.target.value)}
              style={{ marginBottom: 14 }}
            >
              <option value="">Select…</option>
              {catalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.quantity_on_hand} {s.unit})
                </option>
              ))}
              <option value={NEW_SUPPLY}>+ Add new supply</option>
            </select>
          </>
        )}

        {(isNewSupply || isEdit) && (
          <>
            <label className="inv-field-label">Name</label>
            <input
              className="inv-field-input"
              placeholder="Car wash soap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit && isSupplyPurchase(expense!)}
              style={{ marginBottom: 14 }}
            />
          </>
        )}

        {isNewSupply && !isEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label className="inv-field-label">Kind</label>
              <select
                className="inv-field-input"
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as SupplyKind
                  setKind(k)
                  setUnit(k === 'consumable' ? 'each' : 'oz')
                }}
              >
                <option value="chemical">Chemical</option>
                <option value="consumable">Consumable</option>
              </select>
            </div>
            <div>
              <label className="inv-field-label">Unit</label>
              <select className="inv-field-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <label className="inv-field-label">Quantity bought</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input"
          placeholder="128"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="inv-field-label">Total cost ($)</label>
        <input
          type="number"
          inputMode="decimal"
          className="inv-field-input money"
          placeholder="80"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        {costPreview > 0 && (
          <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 14 }}>
            Cost: {fmtDetailed(costPreview)}/{unit || 'unit'}
          </div>
        )}

        <label className="inv-field-label">Vendor (optional)</label>
        <input
          className="inv-field-input"
          placeholder="Chemical Guys"
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
          style={{ marginBottom: 16, resize: 'vertical' }}
        />

        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>
        )}
        {saved && (
          <div style={{ fontSize: 13, color: 'var(--green-text)', marginBottom: 12 }}>Saved</div>
        )}

        <div className="inv-sheet-actions">
          {isEdit && (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={handleDelete}
              disabled={saving}
              aria-label="Delete purchase"
            >
              <Trash size={18} color="var(--red)" />
            </button>
          )}
          <button type="button" className="inv-sheet-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
