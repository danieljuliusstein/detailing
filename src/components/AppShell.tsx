'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import LoggedOutBanner from './LoggedOutBanner'
import BusinessExpenseSheet from './business/BusinessExpenseSheet'
import SupplyPurchaseSheet from './business/SupplyPurchaseSheet'
import LeadSheet from './pipeline/LeadSheet'
import QuickActionMenu from './QuickActionMenu'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import ProductTour from './ProductTour'
import { QuickActionProvider, useQuickAction } from '@/providers/QuickActionContext'
import SyncProvider from '@/providers/SyncProvider'
import { useAuth } from '@/providers/AuthProvider'
import { getPackages } from '@/lib/api'
import type { Package } from '@/lib/types'

function QuickActionOverlays() {
  const {
    expenseSheetOpen,
    closeExpenseSheet,
    supplyPurchaseSheetOpen,
    closeSupplyPurchaseSheet,
    leadSheetOpen,
    leadToEdit,
    closeLeadSheet,
  } = useQuickAction()
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (!leadSheetOpen) return
    getPackages().then(setPackages)
  }, [leadSheetOpen])

  const handleLeadSaved = () => {
    window.dispatchEvent(new Event('leads-changed'))
  }

  return (
    <>
      <QuickActionMenu />
      {expenseSheetOpen && <BusinessExpenseSheet onClose={closeExpenseSheet} />}
      {supplyPurchaseSheetOpen && <SupplyPurchaseSheet onClose={closeSupplyPurchaseSheet} />}
      {leadSheetOpen && packages.length > 0 && (
        <LeadSheet
          lead={leadToEdit}
          packages={packages}
          onClose={closeLeadSheet}
          onSaved={handleLeadSaved}
        />
      )}
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoggedIn } = useAuth()
  const isPortal = pathname.startsWith('/portal')
  const isBook = pathname.startsWith('/book/')
  const isEmbed = pathname.startsWith('/embed/')
  const isSettings = pathname.startsWith('/settings') || pathname === '/privacy'
  const isAuthFlow =
    pathname === '/auth' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/')
  const isPublicClient = isPortal || isBook || isEmbed
  const showLoggedOutBanner = !isPublicClient && !isAuthFlow
  const showProductTour = !isPublicClient && !isAuthFlow && isLoggedIn

  const shellClass = [
    'app-shell',
    isPortal ? 'app-shell--portal' : '',
    isBook ? 'app-shell--book' : '',
    isEmbed ? 'app-shell--embed' : '',
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
          {showLoggedOutBanner ? <LoggedOutBanner /> : null}
          {children}
          <BottomNav />
          {showProductTour ? <ProductTour /> : null}
          {!isPublicClient && <QuickActionOverlays />}
        </div>
      </QuickActionProvider>
    </SyncProvider>
  )
}
