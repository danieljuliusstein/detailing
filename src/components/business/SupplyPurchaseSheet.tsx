'use client'

import { useEffect, useMemo, useState } from 'react'
import { CaretDown, Trash } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
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

interface SupplyPickerProps {
  catalog: Supply[]
  supplyKey: string
  onSelect: (key: string) => void
}

function SupplyPicker({ catalog, supplyKey, onSelect }: SupplyPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = catalog.find((s) => s.id === supplyKey)
  const isNew = supplyKey === NEW_SUPPLY

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((s) => s.name.toLowerCase().includes(q))
  }, [catalog, search])

  const displayLabel = isNew
    ? '+ Add new supply'
    : selected
      ? `${selected.name} (${selected.quantity_on_hand} ${selected.unit})`
      : 'Select…'

  const pick = (key: string) => {
    onSelect(key)
    setSearch('')
    setOpen(false)
  }

  if (supplyKey && !open) {
    return (
      <div className="inv-supply-picker">
        <button
          type="button"
          className="inv-supply-picker-trigger"
          onClick={() => setOpen(true)}
        >
          <span>{displayLabel}</span>
          <CaretDown size={14} color="#8e8e93" />
        </button>
      </div>
    )
  }

  return (
    <div className="inv-supply-picker">
      <input
        className="inv-supply-picker-search"
        placeholder="Search supplies…"
        value={search}
        autoFocus={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
      />
      {open && (
        <div className="inv-supply-picker-dropdown">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`inv-supply-picker-option${supplyKey === s.id ? ' inv-supply-picker-option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s.id)}
            >
              <span className="inv-supply-picker-option-name">{s.name}</span>
              <span className="inv-supply-picker-option-meta">
                {s.quantity_on_hand} {s.unit} on hand
              </span>
            </button>
          ))}
          {filtered.length === 0 && search.trim() !== '' && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#8e8e93' }}>
              No supplies match
            </div>
          )}
          <button
            type="button"
            className="inv-supply-picker-option inv-supply-picker-option--new"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(NEW_SUPPLY)}
          >
            <span className="inv-supply-picker-option-name">+ Add new supply</span>
          </button>
        </div>
      )}
    </div>
  )
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
    <BottomSheet
      title={isEdit ? 'Edit supply purchase' : 'Buy supplies'}
      subtitle="Expense hits P&L this month and stock is added to inventory"
      ariaLabel="Buy supplies"
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
              aria-label="Delete purchase"
              style={{ gridColumn: '1 / -1' }}
            >
              <Trash size={18} color="var(--red)" />
            </button>
          ) : null}
          <button type="button" className="inv-sheet-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log purchase'}
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      }
    >
        <div className="inv-sheet-section">
          <div className="inv-field">
            <label className="inv-field-label" htmlFor="purchase-date">Date</label>
            <input
              id="purchase-date"
              type="date"
              className="inv-field-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="inv-field">
              <label className="inv-field-label">Supply</label>
              <SupplyPicker catalog={catalog} supplyKey={supplyKey} onSelect={setSupplyKey} />
            </div>
          )}

          {(isNewSupply || isEdit) && (
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="purchase-name">Name</label>
              <input
                id="purchase-name"
                className="inv-field-input"
                placeholder="Car wash soap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isEdit && isSupplyPurchase(expense!)}
              />
            </div>
          )}

          {isNewSupply && !isEdit && (
            <div className="inv-field-row">
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="purchase-kind">Kind</label>
                <div className="inv-select-wrap">
                  <select
                    id="purchase-kind"
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
                  <CaretDown className="inv-select-wrap__icon" size={16} weight="bold" aria-hidden />
                </div>
              </div>
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="purchase-unit">Unit</label>
                <div className="inv-select-wrap">
                  <select
                    id="purchase-unit"
                    className="inv-field-input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <CaretDown className="inv-select-wrap__icon" size={16} weight="bold" aria-hidden />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="inv-sheet-divider" />

        <div className="inv-sheet-section">
          <div className="inv-field-row">
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="purchase-qty">Quantity bought</label>
              <input
                id="purchase-qty"
                type="number"
                inputMode="decimal"
                className="inv-field-input"
                placeholder="128"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="purchase-cost">Total cost</label>
              <div className="inv-input-affix inv-input-affix--pre">
                <span className="inv-input-affix__pre">$</span>
                <input
                  id="purchase-cost"
                  type="number"
                  inputMode="decimal"
                  className="inv-field-input"
                  placeholder="80"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {costPreview > 0 && (
                <p className="inv-computed-cost">
                  Cost: {fmtDetailed(costPreview)}/{unit || 'unit'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="inv-sheet-divider" />

        <div className="inv-sheet-section">
          <div className="inv-field">
            <label className="inv-field-label" htmlFor="purchase-vendor">
              Vendor
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <input
              id="purchase-vendor"
              className="inv-field-input"
              placeholder="Chemical Guys"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <label className="inv-field-label" htmlFor="purchase-notes">
              Notes
              <span className="inv-field-label-optional">(optional)</span>
            </label>
            <textarea
              id="purchase-notes"
              className="inv-field-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. bought the gallon size..."
            />
          </div>

          {error && <p className="inv-field-hint" style={{ color: '#fca5a5' }}>{error}</p>}
          {saved && <p className="inv-computed-cost">Saved</p>}
        </div>
    </BottomSheet>
  )
}
