'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { createOverheadExpense, deleteOverheadExpense, getMonthlyOverheadTotal, getOverheadExpenses } from '@/lib/api'
import { useConfirm } from '@/providers/ConfirmProvider'
import { fmtDetailed } from '@/lib/calculations'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { BillingCycle, OverheadCategory, OverheadExpense } from '@/lib/types'

const CATEGORIES: OverheadCategory[] = ['vehicle', 'insurance', 'equipment', 'software', 'marketing', 'other']
const CYCLES: BillingCycle[] = ['monthly', 'annual', 'one_time']

const cycleLabel: Record<BillingCycle, string> = {
  monthly: '/mo',
  annual: '/yr',
  one_time: 'one-time',
}

export default function OverheadTracker() {
  const goBack = useSettingsBack()
  const confirm = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const cycleRef = useRef<HTMLSelectElement>(null)
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

  useEffect(() => {
    if (!showAdd) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(categoryRef.current)
    syncSelectFloatingLabel(cycleRef.current)
  }, [showAdd, name, amount, category, cycle])

  const handleAdd = async () => {
    if (!name.trim() || amount <= 0) return
    await createOverheadExpense({ name: name.trim(), amount, category, billing_cycle: cycle })
    setShowAdd(false)
    setName('')
    setAmount(0)
    await load()
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete expense?',
      message: 'Delete this overhead expense?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    await deleteOverheadExpense(id)
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={goBack} />
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
        <div ref={formRef} className="page-form-card page-form" style={{ marginBottom: 16 }}>
          <div className="section-title">New expense</div>

          <FloatingField id="overhead-name" label="Name" filled={name.trim().length > 0}>
            <input
              id="overhead-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingAffixField
            id="overhead-amount"
            label="Amount"
            filled={amount > 0}
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FloatingField id="overhead-category" label="Category" filled={Boolean(category)}>
              <select
                ref={categoryRef}
                id="overhead-category"
                className={`f-select${category ? ' hv' : ''}`}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as OverheadCategory)
                  syncSelectFloatingLabel(categoryRef.current)
                }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FloatingField>

            <FloatingField id="overhead-cycle" label="Billing cycle" filled={Boolean(cycle)}>
              <select
                ref={cycleRef}
                id="overhead-cycle"
                className={`f-select${cycle ? ' hv' : ''}`}
                value={cycle}
                onChange={(e) => {
                  setCycle(e.target.value as BillingCycle)
                  syncSelectFloatingLabel(cycleRef.current)
                }}
              >
                {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FloatingField>
          </div>

          <div className="page-form-save">
            <SheetSubmitButton
              label="Add expense"
              ready={name.trim().length > 0 && amount > 0}
              onClick={() => void handleAdd()}
            />
          </div>
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
