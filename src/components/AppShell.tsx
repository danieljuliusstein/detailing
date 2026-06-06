'use client'

import BottomNav from './BottomNav'
import BusinessExpenseSheet from './business/BusinessExpenseSheet'
import QuickActionMenu from './QuickActionMenu'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import { QuickActionProvider, useQuickAction } from '@/providers/QuickActionContext'
import SyncProvider from '@/providers/SyncProvider'

function QuickActionOverlays() {
  const { expenseSheetOpen, closeExpenseSheet } = useQuickAction()
  return (
    <>
      <QuickActionMenu />
      {expenseSheetOpen && <BusinessExpenseSheet onClose={closeExpenseSheet} />}
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      <QuickActionProvider>
        <ServiceWorkerCleanup />
        <div className="app-shell">
          {children}
          <BottomNav />
          <QuickActionOverlays />
        </div>
      </QuickActionProvider>
    </SyncProvider>
  )
}
