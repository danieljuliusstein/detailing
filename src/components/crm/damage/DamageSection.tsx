'use client'

import DamageList from '@/components/crm/damage/DamageList'
import AddDamageSheet from '@/components/crm/damage/AddDamageSheet'
import type { DamageRecord } from '@/lib/types'

interface DamageSectionProps {
  damages: DamageRecord[]
  sheetOpen: boolean
  onOpenSheet: () => void
  onCloseSheet: () => void
  onPhotoSelected: (file: File) => void
  onOpenDamage: (damageId: string) => void
}

export default function DamageSection({
  damages,
  sheetOpen,
  onOpenSheet,
  onCloseSheet,
  onPhotoSelected,
  onOpenDamage,
}: DamageSectionProps) {
  return (
    <>
      <p className="section-label">Pre-existing damage</p>
      <DamageList damages={damages} onAdd={onOpenSheet} onOpen={onOpenDamage} />
      {sheetOpen && <AddDamageSheet onPhotoSelected={onPhotoSelected} onClose={onCloseSheet} />}
    </>
  )
}
