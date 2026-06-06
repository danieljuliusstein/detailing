'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import BusinessExpenseSheet from '@/components/business/BusinessExpenseSheet'
import SupplyPurchaseSheet from '@/components/business/SupplyPurchaseSheet'
import { getBusinessExpenses } from '@/lib/api'
import { isSupplyPurchase } from '@/lib/supply-purchase-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { BusinessExpense } from '@/lib/types'

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatRowDate(date: string): string {
  const d = new Date(date.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BusinessExpenses() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<BusinessExpense[]>([])
  const [editing, setEditing] = useState<BusinessExpense | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    const list = await getBusinessExpenses()
    setExpenses([...list].sort((a, b) => b.date.localeCompare(a.date)))
  }

  useEffect(() => {
    load()
  }, [])

  const monthTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      const key = monthKey(e.date)
      map.set(key, (map.get(key) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses])

  const currentMonthKey = monthKey(new Date().toISOString())
  const currentMonthTotal = monthTotals.find(([k]) => k === currentMonthKey)?.[1] ?? 0

  const closeSheet = () => {
    setEditing(null)
    setShowAdd(false)
  }

  const handleSaved = async () => {
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Business expenses</div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowAdd(true)
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Add business expense"
        >
          <Plus size={22} color="var(--green)" weight="bold" />
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</div>
        <div className="money money-negative" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {fmtDetailed(currentMonthTotal)}
        </div>
      </div>

      {monthTotals.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>
            By month
          </div>
          {monthTotals.map(([key, total]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                padding: '6px 0',
                borderBottom: '0.5px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{monthLabel(key)}</span>
              <span className="money money-negative">{fmtDetailed(total)}</span>
            </div>
          ))}
        </div>
      )}

      {expenses.length === 0 && (
        <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No business expenses yet. Tap + to log one.
        </div>
      )}

      {expenses.map((e) => (
        <button
          key={e.id}
          type="button"
          className="card card-pressable"
          style={{
            marginBottom: 10,
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onClick={() => {
            setShowAdd(false)
            setEditing(e)
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {formatRowDate(e.date)} · {e.category ?? 'other'}
              {isSupplyPurchase(e) && e.quantity ? ` · ${e.quantity} units` : ''}
              {e.vendor ? ` · ${e.vendor}` : ''}
            </div>
          </div>
          <div className="money money-negative" style={{ fontSize: 14, fontWeight: 600 }}>
            {fmtDetailed(e.amount)}
          </div>
        </button>
      ))}

      {showAdd && (
        <BusinessExpenseSheet expense={null} onClose={closeSheet} onSaved={handleSaved} />
      )}
      {editing && isSupplyPurchase(editing) && (
        <SupplyPurchaseSheet expense={editing} onClose={closeSheet} onSaved={handleSaved} />
      )}
      {editing && !isSupplyPurchase(editing) && (
        <BusinessExpenseSheet expense={editing} onClose={closeSheet} onSaved={handleSaved} />
      )}
    </div>
  )
}
