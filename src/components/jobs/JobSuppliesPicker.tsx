'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyUsage } from '@/lib/types'

interface JobSuppliesPickerProps {
  supplies: Supply[]
  value: SupplyUsage[]
  onChange: (next: SupplyUsage[]) => void
}

export default function JobSuppliesPicker({ supplies, value, onChange }: JobSuppliesPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const usedIds = useMemo(() => new Set(value.map((u) => u.supply_id)), [value])
  const available = supplies.filter((s) => !usedIds.has(s.id))

  const updateQty = (supplyId: string, qty: number) => {
    if (qty <= 0) {
      onChange(value.filter((u) => u.supply_id !== supplyId))
      return
    }
    const existing = value.find((u) => u.supply_id === supplyId)
    if (existing) {
      onChange(value.map((u) => (u.supply_id === supplyId ? { ...u, quantity_used: qty } : u)))
    } else {
      onChange([...value, { supply_id: supplyId, quantity_used: qty }])
    }
  }

  const addSupply = () => {
    if (!selectedId) return
    onChange([...value, { supply_id: selectedId, quantity_used: 1 }])
    setSelectedId('')
    setPickerOpen(false)
  }

  const removeSupply = (supplyId: string) => {
    onChange(value.filter((u) => u.supply_id !== supplyId))
  }

  return (
    <div>
      {value.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          No supplies logged — add existing items from your catalog.
        </div>
      )}

      {value.map((usage) => {
        const supply = supplies.find((s) => s.id === usage.supply_id)
        if (!supply) return null
        const lineCost =
          supply.cost_per_unit != null
            ? fmtDetailed(supply.cost_per_unit * usage.quantity_used)
            : null

        return (
          <div
            key={usage.supply_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{supply.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {supply.quantity_on_hand} {supply.unit} on hand
                {lineCost ? ` · est. ${lineCost}` : ''}
              </div>
            </div>
            <input
              type="number"
              min={0}
              step={supply.unit === 'each' ? 1 : 0.5}
              className="input"
              style={{ width: 72, textAlign: 'center' }}
              value={usage.quantity_used || ''}
              onChange={(e) =>
                updateQty(usage.supply_id, e.target.value === '' ? 0 : Number(e.target.value))
              }
            />
            <button
              type="button"
              onClick={() => removeSupply(usage.supply_id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              aria-label={`Remove ${supply.name}`}
            >
              <X size={16} color="var(--text-dim)" />
            </button>
          </div>
        )
      })}

      {pickerOpen ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select supply…</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.quantity_on_hand} {s.unit})
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary" onClick={addSupply} disabled={!selectedId}>
            Add
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPickerOpen(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setPickerOpen(true)}
          disabled={available.length === 0}
          style={{ width: '100%', fontSize: 13, marginTop: 4 }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} weight="bold" />
            Add existing supply
          </span>
        </button>
      )}
    </div>
  )
}
