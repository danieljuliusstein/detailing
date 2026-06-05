'use client'

import { useState } from 'react'
import { ArrowsClockwise, CloudSlash } from '@phosphor-icons/react'
import type { SyncStatus } from '@/lib/api'

export default function OfflineBanner({
  status,
  onSync,
}: {
  status: SyncStatus
  onSync: () => Promise<void>
}) {
  const [syncing, setSyncing] = useState(false)

  const show =
    status.pendingWrites > 0 ||
    (status.pocketBaseConfigured && !status.pocketBaseHealthy && status.online === false) ||
    (status.pocketBaseConfigured && !status.pocketBaseHealthy)

  if (!show) return null

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync()
    } finally {
      setSyncing(false)
    }
  }

  const message = !status.online
    ? 'Offline — changes saved locally'
    : status.pendingWrites > 0
      ? `${status.pendingWrites} change${status.pendingWrites === 1 ? '' : 's'} waiting to sync`
      : 'PocketBase unavailable — using local data'

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--amber-dim)', borderBottom: '0.5px solid var(--amber)',
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <CloudSlash size={18} color="var(--amber)" weight="fill" />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{message}</span>
      {status.online && status.pendingWrites > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: 'var(--amber)', border: 'none', borderRadius: 'var(--radius-full)',
            padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#1a1400',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <ArrowsClockwise size={14} weight="bold" />
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      )}
    </div>
  )
}
