'use client'

import { useMemo, useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import JobSuppliesPicker from '@/components/jobs/JobSuppliesPicker'
import { resolveSuppliesUsed } from '@/lib/supplies-logic'
import type { Package, Supply, SupplyUsage } from '@/lib/types'

interface JobSuppliesConfirmSheetProps {
  supplies: Supply[]
  pkg: Package | undefined
  initialUsed?: SupplyUsage[]
  onConfirm: (used: SupplyUsage[]) => void
  onClose: () => void
}

export default function JobSuppliesConfirmSheet({
  supplies,
  pkg,
  initialUsed,
  onConfirm,
  onClose,
}: JobSuppliesConfirmSheetProps) {
  const [value, setValue] = useState<SupplyUsage[]>(() =>
    resolveSuppliesUsed({ supplies_used: initialUsed ?? [] }, pkg, initialUsed)
  )

  const lowWarnings = useMemo(() => {
    const warnings: string[] = []
    for (const usage of value) {
      const supply = supplies.find((s) => s.id === usage.supply_id)
      if (!supply) continue
      const threshold = supply.reorder_threshold
      if (threshold == null) continue
      const after = supply.quantity_on_hand - usage.quantity_used
      if (after < threshold) {
        warnings.push(`${supply.name}: ${after} ${supply.unit} left (reorder at ${threshold})`)
      }
    }
    return warnings
  }, [value, supplies])

  return (
    <BottomSheet
      title="Supplies used"
      subtitle="Confirm or adjust supplies for this job before saving"
      ariaLabel="Confirm supplies used"
      onClose={onClose}
    >
        <JobSuppliesPicker supplies={supplies} value={value} onChange={setValue} />

        {lowWarnings.length > 0 && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(245,166,35,0.12)', border: '0.5px solid rgba(245,166,35,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 6 }}>
              <Warning size={16} /> Low inventory warning
            </div>
            {lowWarnings.map((w) => (
              <div key={w} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{w}</div>
            ))}
          </div>
        )}

        <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => onConfirm(value)}>
          Confirm &amp; save
        </button>
        <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={onClose}>
          Cancel
        </button>
    </BottomSheet>
  )
}
