'use client'

import { fmt, fmtDetailed, fmtLineItem, isLoss } from '@/lib/calculations'

/**
 * Financial display variants — color psychology:
 * - revenue: green (money in)
 * - expense: red (money out, always shown as positive magnitude)
 * - profit: green when positive, red with leading minus when negative
 * - balance: neutral silver for outstanding / warning balances
 * - neutral: primary text, signed when negative
 */
export type CurrencyVariant = 'revenue' | 'expense' | 'profit' | 'balance' | 'neutral'

/** macro = whole dollars on dashboards; line-item = cents only when needed; detailed = invoice totals */
export type CurrencyPrecision = 'macro' | 'line-item' | 'detailed'

export interface CurrencyAmountProps {
  value: number
  variant?: CurrencyVariant
  precision?: CurrencyPrecision
  className?: string
  /** Expenses are displayed as positive magnitudes with expense styling */
  unsigned?: boolean
}

function formatAmount(value: number, precision: CurrencyPrecision, unsigned: boolean): string {
  if (unsigned) {
    return fmt(Math.abs(value), { decimals: precision === 'detailed' ? 2 : 0 })
  }
  switch (precision) {
    case 'line-item':
      return fmtLineItem(value)
    case 'detailed':
      return fmtDetailed(value, value < 0)
    case 'macro':
    default:
      return fmt(value)
  }
}

function currencyClass(variant: CurrencyVariant, value: number, unsigned: boolean): string {
  const displayValue = unsigned ? Math.abs(value) : value
  switch (variant) {
    case 'revenue':
      return 'currency--revenue'
    case 'expense':
      return 'currency--expense'
    case 'profit':
      return isLoss(displayValue) ? 'currency--loss' : 'currency--revenue'
    case 'balance':
      return displayValue > 0 ? 'currency--balance' : 'currency--neutral'
    case 'neutral':
    default:
      return isLoss(displayValue) ? 'currency--loss' : 'currency--neutral'
  }
}

export default function CurrencyAmount({
  value,
  variant = 'neutral',
  precision = 'macro',
  className = '',
  unsigned = false,
}: CurrencyAmountProps) {
  const classes = ['currency-amount', currencyClass(variant, value, unsigned), className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      {formatAmount(value, precision, unsigned)}
    </span>
  )
}
