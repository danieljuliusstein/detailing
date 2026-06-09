'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import BusinessExpenseSheet from './business/BusinessExpenseSheet'
import SupplyPurchaseSheet from './business/SupplyPurchaseSheet'
import QuickActionMenu from './QuickActionMenu'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import { QuickActionProvider, useQuickAction } from '@/providers/QuickActionContext'
import SyncProvider from '@/providers/SyncProvider'

function QuickActionOverlays() {
  const { expenseSheetOpen, closeExpenseSheet, supplyPurchaseSheetOpen, closeSupplyPurchaseSheet } =
    useQuickAction()
  return (
    <>
      <QuickActionMenu />
      {expenseSheetOpen && <BusinessExpenseSheet onClose={closeExpenseSheet} />}
      {supplyPurchaseSheetOpen && <SupplyPurchaseSheet onClose={closeSupplyPurchaseSheet} />}
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/portal')

  return (
    <SyncProvider>
      <QuickActionProvider>
        <ServiceWorkerCleanup />
        <div className={`app-shell${isPortal ? ' app-shell--portal' : ''}`}>
          {children}
          <BottomNav />
          {!isPortal && <QuickActionOverlays />}
        </div>
      </QuickActionProvider>
    </SyncProvider>
  )
}
