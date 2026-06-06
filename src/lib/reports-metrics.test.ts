import { describe, expect, it } from 'vitest'
import { fmtSigned } from './calculations'
import {
  barWidthPct,
  formatBreakdownNetProfit,
  formatDollarDelta,
  formatKpiNetProfit,
  formatMarginPill,
  formatPct,
  formatPctSigned,
  formatPercentDelta,
  formatTotalExpensesAmount,
  marginPillClass,
} from './reports-metrics'

describe('fmtSigned', () => {
  it('formats positive values without minus', () => {
    expect(fmtSigned(120)).toBe('$120.00')
  })

  it('formats negative values with minus prefix', () => {
    expect(fmtSigned(-125.51, 2)).toBe('−$125.51')
  })
})

describe('formatKpiNetProfit', () => {
  it('rounds to whole dollars with sign', () => {
    expect(formatKpiNetProfit(-125.51)).toBe('−$126')
    expect(formatKpiNetProfit(50.4)).toBe('$50')
  })
})

describe('formatBreakdownNetProfit', () => {
  it('shows two decimal places with sign', () => {
    expect(formatBreakdownNetProfit(-125.51)).toBe('−$125.51')
  })
})

describe('marginPillClass', () => {
  it('returns loss class for negative margin', () => {
    expect(marginPillClass(-105)).toContain('reports-margin-pill--loss')
  })

  it('returns positive class for non-negative margin', () => {
    expect(marginPillClass(55)).toContain('reports-margin-pill--pos')
  })
})

describe('barWidthPct', () => {
  it('caps width at 100% when expense exceeds revenue', () => {
    const { width, overflow } = barWidthPct(227.51, 120)
    expect(width).toBe(100)
    expect(overflow).toBeCloseTo(107.51, 2)
  })

  it('returns no overflow when expense is within revenue', () => {
    const { width, overflow } = barWidthPct(50, 120)
    expect(width).toBeCloseTo(41.67, 1)
    expect(overflow).toBe(0)
  })

  it('handles zero revenue', () => {
    expect(barWidthPct(100, 0)).toEqual({ width: 0, overflow: 0 })
  })
})

describe('formatDollarDelta', () => {
  it('shows em dash when both expense totals are zero', () => {
    expect(formatDollarDelta(0, 0, 'this_month')).toBe('—')
  })

  it('shows New when prior is zero and current is non-zero', () => {
    expect(formatDollarDelta(246, 0, 'this_month')).toBe('New')
  })

  it('shows dollar change when prior is non-zero', () => {
    expect(formatDollarDelta(300, 246, 'this_month')).toBe('↑ $54 vs last mo.')
  })
})

describe('formatPct', () => {
  it('shows em dash when revenue is zero', () => {
    expect(formatPct(50, 0)).toBe('—')
  })

  it('rounds percentage against revenue', () => {
    expect(formatPct(50, 120)).toBe('42%')
  })
})

describe('formatPctSigned', () => {
  it('prefixes minus for negative profit share', () => {
    expect(formatPctSigned(-30, 120)).toBe('−25%')
  })
})

describe('formatTotalExpensesAmount', () => {
  it('shows zero without minus prefix', () => {
    expect(formatTotalExpensesAmount(0)).toBe('$0.00')
  })

  it('shows signed expense total', () => {
    expect(formatTotalExpensesAmount(227.51)).toBe('−$227.51')
  })
})

describe('formatMarginPill', () => {
  it('prefixes minus for negative margin', () => {
    expect(formatMarginPill(-105)).toBe('−105%')
  })

  it('shows positive margin without minus', () => {
    expect(formatMarginPill(55)).toBe('55%')
  })
})

describe('formatPercentDelta', () => {
  it('shows New when prior is zero and current is non-zero', () => {
    expect(formatPercentDelta(120, 0, 'this_month')).toBe('New')
  })

  it('shows em dash when both are zero', () => {
    expect(formatPercentDelta(0, 0, 'this_month')).toBe('—')
  })

  it('shows percent change when prior is non-zero', () => {
    expect(formatPercentDelta(150, 100, 'this_month')).toBe('↑ 50% vs last mo.')
    expect(formatPercentDelta(80, 100, 'this_month')).toBe('↓ 20% vs last mo.')
  })
})
