'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface QuickActionContextValue {
  menuOpen: boolean
  expenseSheetOpen: boolean
  supplyPurchaseSheetOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  openExpenseSheet: () => void
  closeExpenseSheet: () => void
  openSupplyPurchaseSheet: () => void
  closeSupplyPurchaseSheet: () => void
}

const QuickActionContext = createContext<QuickActionContextValue | null>(null)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [supplyPurchaseSheetOpen, setSupplyPurchaseSheetOpen] = useState(false)

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openExpenseSheet = useCallback(() => {
    setMenuOpen(false)
    setExpenseSheetOpen(true)
  }, [])
  const closeExpenseSheet = useCallback(() => setExpenseSheetOpen(false), [])
  const openSupplyPurchaseSheet = useCallback(() => {
    setMenuOpen(false)
    setSupplyPurchaseSheetOpen(true)
  }, [])
  const closeSupplyPurchaseSheet = useCallback(() => setSupplyPurchaseSheetOpen(false), [])

  return (
    <QuickActionContext.Provider
      value={{
        menuOpen,
        expenseSheetOpen,
        supplyPurchaseSheetOpen,
        openMenu,
        closeMenu,
        openExpenseSheet,
        closeExpenseSheet,
        openSupplyPurchaseSheet,
        closeSupplyPurchaseSheet,
      }}
    >
      {children}
    </QuickActionContext.Provider>
  )
}

export function useQuickAction() {
  const ctx = useContext(QuickActionContext)
  if (!ctx) throw new Error('useQuickAction must be used within QuickActionProvider')
  return ctx
}
