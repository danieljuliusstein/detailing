'use client'

import { Suspense } from 'react'
import MessagesScreen from '@/components/messages/MessagesScreen'

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading…
        </div>
      }
    >
      <MessagesScreen />
    </Suspense>
  )
}
