'use client'

import { CaretRight, Image as ImageIcon } from '@phosphor-icons/react'
import { formatDamageDate } from '@/lib/damage-docs'
import type { DamageRecord } from '@/lib/types'

interface DamageListRowProps {
  damage: DamageRecord
  onPress: () => void
}

export default function DamageListRow({ damage, onPress }: DamageListRowProps) {
  return (
    <button type="button" className="damage-row" onClick={onPress}>
      <div className="damage-row__thumb">
        {damage.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={damage.photo_url} alt="" />
        ) : (
          <ImageIcon size={20} weight="duotone" aria-hidden="true" />
        )}
      </div>
      <div className="damage-row__body">
        <div className="damage-row__area">{damage.area}</div>
        {damage.note ? <div className="damage-row__note">{damage.note}</div> : null}
        <div className="damage-row__date">{formatDamageDate(damage.date)}</div>
      </div>
      <CaretRight size={15} className="damage-row__chevron" aria-hidden="true" />
    </button>
  )
}
