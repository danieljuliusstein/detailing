import { Suspense } from 'react'
import MessagesScreen from '@/components/messages/MessagesScreen'

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="messages-screen"><p className="messages-empty">Loading…</p></div>}>
      <MessagesScreen />
    </Suspense>
  )
}
