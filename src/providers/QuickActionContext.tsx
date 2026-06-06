'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface QuickActionContextValue {
  menuOpen: boolean
  expenseSheetOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  openExpenseSheet: () => void
  closeExpenseSheet: () => void
}

const QuickActionContext = createContext<QuickActionContextValue | null>(null)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openExpenseSheet = useCallback(() => {
    setMenuOpen(false)
    setExpenseSheetOpen(true)
  }, [])
  const closeExpenseSheet = useCallback(() => setExpenseSheetOpen(false), [])

  return (
    <QuickActionContext.Provider
      value={{
        menuOpen,
        expenseSheetOpen,
        openMenu,
        closeMenu,
        openExpenseSheet,
        closeExpenseSheet,
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
