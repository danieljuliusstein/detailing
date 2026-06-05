'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Warning } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { createSupply, getSupplies, restockSupply } from '@/lib/api'
import { isLowStock } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply } from '@/lib/types'

export default function Inventory() {
  const router = useRouter()
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('each')
  const [qty, setQty] = useState(0)
  const [threshold, setThreshold] = useState(0)
  const [cost, setCost] = useState(0)

  const load = async () => setSupplies(await getSupplies())
  useEffect(() => { load() }, [])

  const handleRestock = async (id: string) => {
    const amount = prompt('How many to add?')
    if (!amount) return
    const delta = Number(amount)
    if (!Number.isFinite(delta) || delta <= 0) return
    await restockSupply(id, delta)
    await load()
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    await createSupply({
      name: name.trim(),
      unit: unit.trim() || 'each',
      quantity_on_hand: qty,
      reorder_threshold: threshold || undefined,
      cost_per_unit: cost || undefined,
    })
    setShowAdd(false)
    setName('')
    setQty(0)
    setThreshold(0)
    setCost(0)
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
            <input className="input" placeholder="Unit (oz, each…)" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <input type="number" className="input" placeholder="Qty on hand" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="number" className="input" placeholder="Reorder at" value={threshold || ''} onChange={(e) => setThreshold(Number(e.target.value))} />
            <input type="number" step="0.01" className="input" placeholder="Cost/unit" value={cost || ''} onChange={(e) => setCost(Number(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={handleAdd} style={{ width: '100%' }}>Add supply</button>
        </div>
      )}

      {supplies.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No supplies yet</div>
      )}

      {supplies.map((s) => {
        const low = isLowStock(s)
        return (
          <div key={s.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.quantity_on_hand} {s.unit}
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
            <button className="btn-ghost" onClick={() => handleRestock(s.id)} style={{ width: '100%', fontSize: 13 }}>
              Restock
            </button>
          </div>
        )
      })}
    </div>
  )
}
