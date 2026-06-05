'use client'

import { useCallback, useEffect, useState } from 'react'
import OfflineBanner from '@/components/OfflineBanner'
import { getSyncStatus, resetBackend, syncOnReconnect, type SyncStatus } from '@/lib/api'
import { getInternalApiSecret, runNotificationsCheck } from '@/lib/export-data'

const CRON_LAST_KEY = 'detailing_cron_last_run'

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await getSyncStatus())
  }, [])

  const handleSync = useCallback(async () => {
    await syncOnReconnect()
    resetBackend()
    await refresh()
  }, [refresh])

  useEffect(() => {
    refresh()

    const onOnline = () => { handleSync() }
    window.addEventListener('online', onOnline)

    // Run notification cron once per day when API secret is configured
    if (getInternalApiSecret()) {
      const last = Number(localStorage.getItem(CRON_LAST_KEY) ?? 0)
      if (Date.now() - last > 86_400_000) {
        runNotificationsCheck().then(() => {
          localStorage.setItem(CRON_LAST_KEY, String(Date.now()))
        })
      }
    }

    const interval = setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('online', onOnline)
      clearInterval(interval)
    }
  }, [refresh, handleSync])

  return (
    <>
      {status && <OfflineBanner status={status} onSync={handleSync} />}
      {children}
    </>
  )
}
