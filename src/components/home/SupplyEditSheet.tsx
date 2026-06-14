'use client'

import { useEffect, useMemo, useState } from 'react'
import { CaretDown, Trash, Warning } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import InventoryImagePicker from '@/components/inventory/InventoryImagePicker'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyAddOptions, SupplyInput, SupplyKind } from '@/lib/types'

export type SupplySheetMode = 'add' | 'edit' | 'restock'

const CHEMICAL_UNITS = ['oz', 'gal', 'ml', 'L'] as const
const CONSUMABLE_UNITS = ['each', 'box', 'pack'] as const

interface SupplyEditSheetProps {
  supply: Supply | null
  kind: SupplyKind
  mode: SupplySheetMode
  onSaveAdd: (input: SupplyInput, options?: SupplyAddOptions) => Promise<void>
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('bought_new')
  const [costPerUnitManual, setCostPerUnitManual] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
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
      setImageUrl(null)
      setAcquisition('bought_new')
      setCostPerUnitManual('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
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
    setImageUrl(supply.image_url ?? null)
    setRestockQty('')
    setRestockCost('')
  }, [supply, mode, kind, defaultUnit])

  const computedCostPerUnit = useMemo(() => {
    const q = Number(qty)
    const c = Number(totalCost)
    if (mode !== 'add' || acquisition !== 'bought_new' || !q || !c) return 0
    return costPerUnitFromPurchase(q, c)
  }, [mode, qty, totalCost, acquisition])

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
        const input: SupplyInput = {
          name: trimmed,
          unit: activeUnit,
          quantity_on_hand: quantity,
          reorder_threshold: Number(reorderAt) || undefined,
          cost_per_unit:
            acquisition === 'bought_new'
              ? computedCostPerUnit || undefined
              : Number(costPerUnitManual) || undefined,
          supplier: supplier.trim() || undefined,
          kind,
          notes: notes.trim() || undefined,
          image_url: imageUrl ?? undefined,
        }
        const includeExpense = acquisition === 'bought_new'
        const options: SupplyAddOptions = includeExpense
          ? {
              logExpense: true,
              totalPaid: Number(totalCost) || undefined,
              purchaseDate,
            }
          : { logExpense: false }
        await onSaveAdd(input, options)
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
          image_url: imageUrl ?? undefined,
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

  const saveLabel =
    saving ? 'Saving…' : mode === 'add' ? 'Add to catalog' : mode === 'restock' ? 'Restock' : 'Save changes'

  return (
    <BottomSheet
      title={title}
      subtitle={subtitle}
      sheetClassName="inv-sheet--form"
      onClose={onClose}
      footer={
        <div className="inv-sheet-actions inv-sheet-actions--split">
          {mode === 'edit' && supply && onDelete ? (
            <button
              type="button"
              className="inv-sheet-delete"
              onClick={() => onDelete(supply.id)}
              aria-label="Delete item"
              style={{ gridColumn: '1 / -1' }}
            >
              <Trash size={18} weight="bold" color="#f87171" />
            </button>
          ) : null}
          <button
            type="button"
            className="inv-sheet-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saveLabel}
          </button>
          <button type="button" className="inv-sheet-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="inv-sheet-body">
        {mode !== 'restock' && (
          <div className="inv-sheet-section">
            <InventoryImagePicker imageUrl={imageUrl} onChange={setImageUrl} />
          </div>
        )}

        {supply && mode !== 'add' && onModeChange && (
          <div className="inv-sheet-section">
            <div className="inv-status-toggle">
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
          </div>
        )}

        {mode === 'edit' && supply && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <div className="item-detail-panel">
                <p className="item-detail-panel__title">Current stock</p>
                <div className="item-detail-row">
                  <span className="item-detail-row__label">On hand</span>
                  <span>{supply.quantity_on_hand} {supply.unit}</span>
                </div>
                {supply.cost_per_unit != null && supply.cost_per_unit > 0 && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Cost / {supply.unit}</span>
                    <span>{fmtDetailed(supply.cost_per_unit)}</span>
                  </div>
                )}
                {supply.reorder_threshold != null && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Reorder at</span>
                    <span>{supply.reorder_threshold} {supply.unit}</span>
                  </div>
                )}
                {supply.supplier && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Supplier</span>
                    <span>{supply.supplier}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {mode !== 'restock' && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="supply-name">Name</label>
                <input
                  id="supply-name"
                  className="inv-field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item name"
                />
              </div>

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="supply-unit">Measure in</label>
                <div className="inv-select-wrap">
                  <select
                    id="supply-unit"
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
                  <CaretDown className="inv-select-wrap__icon" size={16} weight="bold" aria-hidden />
                </div>
                <p className="inv-field-hint">All amounts below use this unit ({activeUnit})</p>
              </div>
            </div>
          </>
        )}

        {mode === 'edit' && (
          <div className="inv-sheet-section">
            <div className="inv-field">
              <label className="inv-field-label" htmlFor="supply-on-hand">
                Quantity on hand ({activeUnit})
              </label>
              <input
                id="supply-on-hand"
                className="inv-field-input"
                type="number"
                min={0}
                step={activeUnit === 'each' ? 1 : 0.5}
                value={onHand}
                onChange={(e) => setOnHand(e.target.value)}
                placeholder={`e.g. 128 ${activeUnit}`}
              />
            </div>
          </div>
        )}

        {mode === 'add' && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <AcquisitionToggle value={acquisition} onChange={setAcquisition} />

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="supply-qty">
                  Starting amount ({activeUnit})
                </label>
                <input
                  id="supply-qty"
                  className="inv-field-input"
                  type="number"
                  min={0}
                  step={activeUnit === 'each' ? 1 : 0.5}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={`e.g. 128 ${activeUnit}`}
                />
              </div>

              {acquisition === 'bought_new' ? (
                <>
                  <div className="inv-field">
                    <label className="inv-field-label" htmlFor="supply-paid">Amount paid</label>
                    <div className="inv-input-affix inv-input-affix--pre">
                      <span className="inv-input-affix__pre">$</span>
                      <input
                        id="supply-paid"
                        className="inv-field-input"
                        type="number"
                        min={0}
                        step="0.01"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        placeholder="19.20"
                      />
                    </div>
                  </div>

                  <div className="inv-field-row">
                    <div className="inv-field">
                      <label className="inv-field-label" htmlFor="supply-vendor">Vendor</label>
                      <input
                        id="supply-vendor"
                        className="inv-field-input"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="inv-field">
                      <label className="inv-field-label" htmlFor="supply-date">Purchase date</label>
                      <input
                        id="supply-date"
                        className="inv-field-input"
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {computedCostPerUnit > 0 && (
                    <p className="inv-computed-cost">
                      Cost per {activeUnit}: {fmtDetailed(computedCostPerUnit)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="inv-field">
                    <label className="inv-field-label" htmlFor="supply-cpu">
                      Cost per {activeUnit}
                      <span className="inv-field-label-optional">(optional)</span>
                    </label>
                    <div className="inv-input-affix inv-input-affix--pre">
                      <span className="inv-input-affix__pre">$</span>
                      <input
                        id="supply-cpu"
                        className="inv-field-input"
                        type="number"
                        min={0}
                        step="0.01"
                        value={costPerUnitManual}
                        onChange={(e) => setCostPerUnitManual(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <p className="inv-field-hint">For job costing only — not logged as expense</p>
                  </div>

                  <div className="inv-field">
                    <label className="inv-field-label" htmlFor="supply-supplier-no-exp">
                      Supplier
                      <span className="inv-field-label-optional">(optional)</span>
                    </label>
                    <input
                      id="supply-supplier-no-exp"
                      className="inv-field-input"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Where you buy it"
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {mode === 'restock' && supply && (
          <>
            <div className="inv-sheet-section">
              <p className="inv-field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
                Currently on hand: {supply.quantity_on_hand} {supply.unit}
                {supply.cost_per_unit ? ` · ${fmtDetailed(supply.cost_per_unit)}/${supply.unit}` : ''}
              </p>

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="restock-qty">
                  Add to stock ({supply.unit})
                </label>
                <input
                  id="restock-qty"
                  className="inv-field-input"
                  type="number"
                  min={0}
                  step={supply.unit === 'each' ? 1 : 0.5}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder={`e.g. 128 ${supply.unit}`}
                />
              </div>

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="restock-paid">Total paid</label>
                <div className="inv-input-affix inv-input-affix--pre">
                  <span className="inv-input-affix__pre">$</span>
                  <input
                    id="restock-paid"
                    className="inv-field-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    placeholder="19.20"
                  />
                </div>
                {restockCostPerUnit > 0 && (
                  <p className="inv-computed-cost">
                    This purchase: {fmtDetailed(restockCostPerUnit)}/{supply.unit} (blended into stock)
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {mode !== 'restock' && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="supply-reorder">
                  Low stock alert at ({activeUnit})
                  <span className="inv-alert-badge">
                    <Warning size={10} weight="fill" aria-hidden />
                    Alert
                  </span>
                </label>
                <input
                  id="supply-reorder"
                  className="inv-field-input"
                  type="number"
                  min={0}
                  step={activeUnit === 'each' ? 1 : 0.5}
                  value={reorderAt}
                  onChange={(e) => setReorderAt(e.target.value)}
                  placeholder={`e.g. 32 ${activeUnit}`}
                />
                <p className="inv-field-hint">Shows LOW when on hand drops below this amount</p>
              </div>

              {mode === 'edit' && (
                <div className="inv-field">
                  <label className="inv-field-label" htmlFor="supply-supplier-edit">
                    Supplier
                    <span className="inv-field-label-optional">(optional)</span>
                  </label>
                  <input
                    id="supply-supplier-edit"
                    className="inv-field-input"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Where you buy it"
                  />
                </div>
              )}

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="supply-notes">
                  Notes
                  <span className="inv-field-label-optional">(optional)</span>
                </label>
                <textarea
                  id="supply-notes"
                  className="inv-field-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. need 1 gallon jug next order..."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
