'use client'

import { PencilSimple } from '@phosphor-icons/react'
import {
  inventoryRowVariant,
  supplyMetaLabel,
  supplyQuantityLabel,
} from '@/components/inventory/inventory-utils'
import { fmtDetailed } from '@/lib/calculations'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { BusinessExpense, Equipment, Supply } from '@/lib/types'

interface RowBaseProps {
  onPress: () => void
}

export function SupplyInventoryRow({
  supply,
  onPress,
  inExpenses = false,
}: RowBaseProps & { supply: Supply; inExpenses?: boolean }) {
  const variant = inventoryRowVariant(supply)
  const variantClass = variant ? ` inventory-row--${variant}` : ''

  return (
    <div
      role="button"
      tabIndex={0}
      className={`inventory-row${variantClass}`}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress()
        }
      }}
    >
      <div className="inventory-row__main">
        <p className="inventory-row__name">
          {supply.name}
          {inExpenses && <span className="inv-expense-linked-badge">In expenses</span>}
        </p>
        <p className="inventory-row__meta">{supplyMetaLabel(supply)}</p>
      </div>
      <div className="inventory-row__value">
        <p className="inventory-row__quantity">{supplyQuantityLabel(supply)}</p>
        <PencilSimple className="inventory-row__edit-icon" size={15} weight="bold" aria-hidden />
      </div>
    </div>
  )
}

export function EquipmentInventoryRow({
  item,
  onPress,
  inExpenses = false,
}: RowBaseProps & { item: Equipment; inExpenses?: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="inventory-row"
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress()
        }
      }}
    >
      <div className="inventory-row__main">
        <p className="inventory-row__name">
          {item.name}
          {inExpenses && <span className="inv-expense-linked-badge">In expenses</span>}
        </p>
        {item.purchase_date && (
          <p className="inventory-row__meta">Purchased {item.purchase_date}</p>
        )}
      </div>
      <div className="inventory-row__value">
        {item.purchase_price != null && item.purchase_price > 0 && (
          <p className="inventory-row__quantity">{fmtDetailed(item.purchase_price)}</p>
        )}
        <PencilSimple className="inventory-row__edit-icon" size={15} weight="bold" aria-hidden />
      </div>
    </div>
  )
}

export function WishlistInventoryRow({ item, onPress }: RowBaseProps & { item: HomeInventoryItem }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="inventory-row"
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress()
        }
      }}
    >
      <div className="inventory-row__main">
        <p className="inventory-row__name">{item.name}</p>
        {item.notes && <p className="inventory-row__meta">{item.notes}</p>}
      </div>
      <div className="inventory-row__value">
        <p className="inventory-row__quantity">${item.priceEstimate ?? 0}</p>
        <PencilSimple className="inventory-row__edit-icon" size={15} weight="bold" aria-hidden />
      </div>
    </div>
  )
}
