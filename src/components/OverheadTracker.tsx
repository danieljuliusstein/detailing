'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { createOverheadExpense, deleteOverheadExpense, getMonthlyOverheadTotal, getOverheadExpenses } from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import type { BillingCycle, OverheadCategory, OverheadExpense } from '@/lib/types'

const CATEGORIES: OverheadCategory[] = ['vehicle', 'insurance', 'equipment', 'software', 'marketing', 'other']
const CYCLES: BillingCycle[] = ['monthly', 'annual', 'one_time']

const cycleLabel: Record<BillingCycle, string> = {
  monthly: '/mo',
  annual: '/yr',
  one_time: 'one-time',
}

export default function OverheadTracker() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<OverheadExpense[]>([])
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState<OverheadCategory>('other')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  const load = async () => {
    const [list, total] = await Promise.all([getOverheadExpenses(), getMonthlyOverheadTotal()])
    setExpenses(list)
    setMonthlyTotal(total)
  }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!name.trim() || amount <= 0) return
    await createOverheadExpense({ name: name.trim(), amount, category, billing_cycle: cycle })
    setShowAdd(false)
    setName('')
    setAmount(0)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteOverheadExpense(id)
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Overhead</div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Add expense"
        >
          <Plus size={22} color="var(--green)" weight="bold" />
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly recurring</div>
        <div className="money money-negative" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {fmtDetailed(monthlyTotal)}
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">New expense</div>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8 }} />
          <input type="number" className="input money" placeholder="Amount" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} style={{ marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as OverheadCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
              {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleAdd} style={{ width: '100%' }}>Add expense</button>
        </div>
      )}

      {expenses.map((e) => (
        <div key={e.id} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {e.category ?? 'other'} · {cycleLabel[e.billing_cycle ?? 'monthly']}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="money money-negative" style={{ fontSize: 14, fontWeight: 600 }}>{fmtDetailed(e.amount)}</div>
            <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--red)', cursor: 'pointer', marginTop: 4 }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
