'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import BusinessExpenseSheet from './business/BusinessExpenseSheet'
import SupplyPurchaseSheet from './business/SupplyPurchaseSheet'
import QuickActionMenu from './QuickActionMenu'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import ProductTour from './ProductTour'
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
  const isBook = pathname.startsWith('/book/')
  const isSettings = pathname.startsWith('/settings') || pathname === '/privacy'
  const isAuthFlow =
    pathname === '/auth' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/')
  const showProductTour = !isPortal && !isBook && !isAuthFlow

  const shellClass = [
    'app-shell',
    isPortal ? 'app-shell--portal' : '',
    isBook ? 'app-shell--book' : '',
    isSettings ? 'app-shell--settings' : '',
    isAuthFlow ? 'app-shell--auth-flow' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <SyncProvider>
      <QuickActionProvider>
        <ServiceWorkerCleanup />
        <div className={shellClass}>
          {children}
          <BottomNav />
          {showProductTour ? <ProductTour /> : null}
          {!isPortal && !isBook && <QuickActionOverlays />}
        </div>
      </QuickActionProvider>
    </SyncProvider>
  )
}
