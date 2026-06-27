'use client'

import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Package } from '@phosphor-icons/react'
import {
  monogramColor,
  monogramForName,
  stockBarLevel,
  stockBarPercent,
  supplyQuantityLabel,
} from '@/components/inventory/inventory-utils'
import type { Supply } from '@/lib/types'

interface Props {
  supply: Supply
  onPress: () => void
  FallbackIcon?: PhosphorIcon
  inExpenses?: boolean
}

export default function ProductTile({ supply, onPress, FallbackIcon = Package, inExpenses = false }: Props) {
  const level = stockBarLevel(supply)
  const pct = stockBarPercent(supply)

  return (
    <button type="button" className="product-tile" onClick={onPress}>
      <div className="product-tile__media">
        {supply.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={supply.image_url} alt="" className="product-tile__img" loading="lazy" />
        ) : (
          <div
            className="product-tile__monogram"
            style={{ background: monogramColor(supply.name) }}
          >
            <FallbackIcon size={24} weight="duotone" color="rgba(255,255,255,0.85)" aria-hidden />
            <span className="product-tile__mono-text">{monogramForName(supply.name)}</span>
          </div>
        )}
        {inExpenses && (
          <span className="product-tile__expense-badge inv-expense-linked-badge">In expenses</span>
        )}
      </div>
      <div className="product-tile__body">
        <p className="product-tile__name">{supply.name}</p>
        <p className="product-tile__qty">{supplyQuantityLabel(supply)}</p>
        <div className="product-tile__bar-track" aria-hidden>
          <div
            className={`product-tile__bar-fill product-tile__bar-fill--${level}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}
