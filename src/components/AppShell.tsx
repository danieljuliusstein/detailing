'use client'

import BottomNav from './BottomNav'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import SyncProvider from '@/providers/SyncProvider'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      <ServiceWorkerCleanup />
      <div className="app-shell">
        {children}
        <BottomNav />
      </div>
    </SyncProvider>
  )
}
