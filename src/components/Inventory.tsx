'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Warning } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { createSupply, getSupplies, restockSupply } from '@/lib/api'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyKind } from '@/lib/types'

const KIND_LABELS: Record<SupplyKind, string> = {
  chemical: 'Chemical',
  consumable: 'Consumable',
  other: 'Other',
}

export default function Inventory() {
  const router = useRouter()
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [restockId, setRestockId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('oz')
  const [kind, setKind] = useState<SupplyKind>('other')
  const [qty, setQty] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [threshold, setThreshold] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')

  const load = async () => setSupplies(await getSupplies())
  useEffect(() => { load() }, [])

  const computedCost =
    Number(qty) > 0 && Number(totalCost) > 0
      ? costPerUnitFromPurchase(Number(qty), Number(totalCost))
      : 0

  const handleRestock = async () => {
    if (!restockId) return
    const quantity = Number(restockQty)
    if (!quantity || quantity <= 0) return
    const cost = Number(restockCost)
    await restockSupply(restockId, {
      quantity,
      total_cost: cost > 0 ? cost : undefined,
    })
    setRestockId(null)
    setRestockQty('')
    setRestockCost('')
    await load()
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    const quantity = Number(qty)
    if (!quantity) return
    await createSupply({
      name: name.trim(),
      unit: unit.trim() || 'each',
      quantity_on_hand: quantity,
      reorder_threshold: Number(threshold) || undefined,
      cost_per_unit: computedCost || undefined,
      kind,
    })
    setShowAdd(false)
    setName('')
    setQty('')
    setTotalCost('')
    setThreshold('')
    setKind('other')
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Inventory</div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Add supply"
        >
          <Plus size={22} color="var(--green)" weight="bold" />
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">New supply</div>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as SupplyKind)}>
              <option value="chemical">Chemical</option>
              <option value="consumable">Consumable</option>
              <option value="other">Other</option>
            </select>
            <input className="input" placeholder="Unit (oz, each…)" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input type="number" className="input" placeholder="Qty on hand" value={qty} onChange={(e) => setQty(e.target.value)} />
            <input type="number" step="0.01" className="input" placeholder="Total paid ($)" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} />
          </div>
          {computedCost > 0 && (
            <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>
              Cost/unit: {fmtDetailed(computedCost)}
            </div>
          )}
          <input type="number" className="input" placeholder="Reorder at" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ marginBottom: 12 }} />
          <button className="btn-primary" onClick={handleAdd} style={{ width: '100%' }}>Add supply</button>
        </div>
      )}

      {restockId && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Restock</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="number" className="input" placeholder="Qty added" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
            <input type="number" step="0.01" className="input" placeholder="Total paid ($)" value={restockCost} onChange={(e) => setRestockCost(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-primary" onClick={handleRestock}>Confirm restock</button>
            <button className="btn-ghost" onClick={() => setRestockId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {supplies.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No supplies yet</div>
      )}

      {supplies.map((s) => {
        const low = s.reorder_threshold != null && s.quantity_on_hand <= s.reorder_threshold
        return (
          <div key={s.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {KIND_LABELS[s.kind ?? 'other']} · {s.quantity_on_hand} {s.unit}
                  {s.cost_per_unit ? ` · ${fmtDetailed(s.cost_per_unit)}/${s.unit}` : ''}
                </div>
              </div>
              {low && (
                <span className="badge badge-overdue" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <Warning size={12} weight="fill" /> Low
                </span>
              )}
            </div>
            {s.reorder_threshold != null && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                Reorder at {s.reorder_threshold} {s.unit}
              </div>
            )}
            <button className="btn-ghost" onClick={() => setRestockId(s.id)} style={{ width: '100%', fontSize: 13 }}>
              Restock
            </button>
          </div>
        )
      })}
    </div>
  )
}
