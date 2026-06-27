'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import {
  clearLocalDeviceData,
  clearOfflineQueue,
  flushOfflineQueue,
  getActiveBackend,
  getMigrationStatus,
  getSyncStatus,
  resetBackend,
  runDataMigration,
  type FlushResult,
  type MigrationResult,
  type MigrationStatus,
  type SyncStatus,
} from '@/lib/api'
import { buildLocalExport, downloadJson, runNotificationsCheck, triggerServerBackup } from '@/lib/export-data'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import { saveSettingsAsync } from '@/lib/settings'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

function DeveloperToolsPanel({
  backend,
  migration,
  syncStatus,
  syncErrors,
  migrationMsg,
  migrating,
  syncing,
  cronMsg,
  onMigrate,
  onSyncNow,
  onClearQueue,
  onRunCron,
  onReconnectCloud,
  onClearLocal,
}: {
  backend: 'local' | 'pocketbase' | '…'
  migration: MigrationStatus | null
  syncStatus: SyncStatus | null
  syncErrors: string[]
  migrationMsg: string | null
  migrating: boolean
  syncing: boolean
  cronMsg: string | null
  onMigrate: () => void
  onSyncNow: () => void
  onClearQueue: () => void
  onRunCron: () => void
  onReconnectCloud: () => void
  onClearLocal: () => void
}) {
  return (
    <details className="settings-developer">
      <summary className="settings-developer__summary">Developer tools</summary>
      <div className="settings-developer__body">
        <div className="settings-status-line settings-developer__status">
          Data backend:{' '}
          <span className={`badge ${backend === 'pocketbase' ? 'badge-paid' : 'badge-draft'}`}>
            {backend === '…' ? 'Checking…' : backend === 'pocketbase' ? 'PocketBase' : 'Local storage'}
          </span>
        </div>
        {backend === 'local' ? (
          <>
            <p className="settings-msg settings-msg--warn">
              Showing data stored on this device only. Connect to PocketBase to load your cloud jobs and clients.
            </p>
            <Button type="button" variant="ghost" onClick={onReconnectCloud}>
              Reconnect to cloud
            </Button>
          </>
        ) : null}
        {migration ? (
          <p className="settings-status-line">
            Local: {migration.localJobCount} jobs, {migration.localClientCount} clients
            {migration.pocketBaseJobCount != null && ` · PocketBase: ${migration.pocketBaseJobCount} jobs`}
            {migration.migrated ? ' · Migrated' : ''}
          </p>
        ) : null}
        {syncStatus && syncStatus.pendingWrites > 0 ? (
          <p className="settings-msg settings-msg--warn">
            {syncStatus.pendingWrites} pending write{syncStatus.pendingWrites === 1 ? '' : 's'} in offline queue
          </p>
        ) : null}
        {syncErrors.length > 0 ? (
          <div className="settings-msg settings-msg--error">
            {syncErrors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        ) : null}
        {migrationMsg ? <p className="settings-msg">{migrationMsg}</p> : null}
        <Button
          type="button"
          variant="ghost"
          onClick={onMigrate}
          disabled={
            migrating ||
            (migration?.migrated === true &&
              migration.pocketBaseJobCount != null &&
              migration.localJobCount <= migration.pocketBaseJobCount)
          }
        >
          {migrating
            ? 'Migrating…'
            : migration?.migrated &&
                migration.pocketBaseJobCount != null &&
                migration.localJobCount <= migration.pocketBaseJobCount
              ? 'Migration complete'
              : 'Migrate local data to PocketBase'}
        </Button>
        <Button type="button" variant="ghost" onClick={onSyncNow} disabled={syncing || !syncStatus?.pendingWrites}>
          {syncing ? 'Syncing…' : 'Sync pending changes'}
        </Button>
        {syncStatus && syncStatus.pendingWrites > 0 ? (
          <Button type="button" variant="ghost" className="settings-btn-danger" onClick={onClearQueue}>
            Clear sync queue
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onRunCron}>
          Run notification check now
        </Button>
        {cronMsg ? <p className="settings-msg">{cronMsg}</p> : null}
        <Button type="button" variant="ghost" className="settings-btn-muted" onClick={onClearLocal}>
          Clear local device data
        </Button>
      </div>
    </details>
  )
}

export default function SettingsAccessPage() {
  const router = useRouter()
  const { settings, ready, reload } = useSettingsDraft()
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const [backend, setBackend] = useState<'local' | 'pocketbase' | '…'>('…')
  const [migration, setMigration] = useState<MigrationStatus | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [migrationMsg, setMigrationMsg] = useState<string | null>(null)
  const [cronMsg, setCronMsg] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)

  const refreshSync = async () => {
    const [b, m, s] = await Promise.all([getActiveBackend(), getMigrationStatus(), getSyncStatus()])
    setBackend(b)
    setMigration(m)
    setSyncStatus(s)
  }

  useEffect(() => {
    void refreshSync()
  }, [])

  const handleBackup = async () => {
    if (!settings) return
    setBackingUp(true)
    setBackupMsg(null)
    try {
      const result = await triggerServerBackup()
      if (result.ok && settings) {
        await saveSettingsAsync({ ...settings, last_backup_at: new Date().toISOString() })
        await reload()
        setBackupMsg('PocketBase backup downloaded')
      } else {
        setBackupMsg(result.error ?? 'Backup failed')
      }
    } finally {
      setBackingUp(false)
    }
  }

  const handleExport = () => {
    const bundle = buildLocalExport()
    downloadJson(bundle, `detailing-export-${bundle.exported_at.slice(0, 10)}.json`)
  }

  const handleMigrate = async () => {
    if (!confirm('Migrate local data to PocketBase? Only run this once when moving off demo storage.')) return
    setMigrating(true)
    setMigrationMsg(null)
    try {
      const result: MigrationResult = await runDataMigration()
      if (result.skipped) {
        setMigrationMsg('Migration skipped — PocketBase already has data or migration was completed.')
      } else {
        setMigrationMsg(
          `Migrated ${result.clients} clients, ${result.jobs} jobs, ${result.invoices} invoices, ${result.supplies} supplies, ${result.overhead} overhead, ${result.photos} photos.`
        )
      }
      resetBackend()
      await refreshSync()
    } catch (err) {
      setMigrationMsg(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncErrors([])
    try {
      const result: FlushResult = await flushOfflineQueue()
      if (result.errors.length > 0) setSyncErrors(result.errors)
      resetBackend()
      await refreshSync()
    } finally {
      setSyncing(false)
    }
  }

  const handleClearQueue = async () => {
    if (!confirm('Clear all pending offline writes? Unsynced changes will be lost.')) return
    await clearOfflineQueue()
    setSyncErrors([])
    await refreshSync()
  }

  const handleRunCron = async () => {
    setCronMsg(null)
    const result = await runNotificationsCheck()
    if (result.ok) {
      setCronMsg(`Checked — ${result.created ?? 0} new notification(s)`)
    } else {
      setCronMsg(result.error ?? 'Check failed')
    }
  }

  const handleReconnectCloud = async () => {
    await clearLocalDeviceData()
    resetBackend()
    await refreshSync()
    window.location.reload()
  }

  const handleClearLocal = async () => {
    if (!confirm('Clear demo and cached data on this device? Cloud data on PocketBase is not deleted.')) return
    await clearLocalDeviceData()
    resetBackend()
    window.location.reload()
  }

  const handleDeleteAccount = async () => {
    if (!settings) return
    setDeleting(true)
    setDeleteMsg(null)
    try {
      const token = getPocketBaseAuthToken()
      if (!token) throw new Error('Not signed in')
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: deleteConfirmName,
          confirmed: deleteConfirmed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      router.replace('/auth')
      window.location.reload()
    } catch (e) {
      setDeleteMsg(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="Access and data" showSave={false}>
      <div className="settings-panel settings-panel--flush">
        <div className="settings-divider" />
        <p className="settings-status-line">
          Last backup: {settings.last_backup_at ? new Date(settings.last_backup_at).toLocaleDateString() : 'Never'}
        </p>
        <Button type="button" variant="ghost" onClick={() => void handleBackup()} disabled={backingUp}>
          {backingUp ? 'Backing up…' : 'Backup now (PocketBase)'}
        </Button>
        <Button type="button" variant="ghost" onClick={handleExport}>
          Export all data (local JSON)
        </Button>
        {backupMsg ? <p className="settings-msg">{backupMsg}</p> : null}
        <div className="settings-divider" />
        <Link href="/privacy" className="settings-row-link settings-row-link--plain">
          <span>Privacy policy</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <DeveloperToolsPanel
          backend={backend}
          migration={migration}
          syncStatus={syncStatus}
          syncErrors={syncErrors}
          migrationMsg={migrationMsg}
          migrating={migrating}
          syncing={syncing}
          cronMsg={cronMsg}
          onMigrate={() => void handleMigrate()}
          onSyncNow={() => void handleSyncNow()}
          onClearQueue={() => void handleClearQueue()}
          onRunCron={() => void handleRunCron()}
          onReconnectCloud={() => void handleReconnectCloud()}
          onClearLocal={() => void handleClearLocal()}
        />
      </div>

      <section className="card settings-delete-account">
        <h2 className="settings-delete-account__title">Delete account</h2>
        <p className="settings-panel__lead">
          Permanently delete your organization, jobs, clients, and settings. This cannot be undone.
        </p>
        <Button type="button" variant="ghost" onClick={handleExport}>
          Export all data first (recommended)
        </Button>
        <label className="settings-delete-account__field">
          <span>Type your business name to confirm: <strong>{settings.business_name}</strong></span>
          <input
            className="f-input"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="settings-delete-account__check">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
          />
          <span>I understand this is permanent</span>
        </label>
        <Button
          type="button"
          variant="danger"
          disabled={deleting || deleteConfirmName.trim() !== settings.business_name.trim() || !deleteConfirmed}
          onClick={() => void handleDeleteAccount()}
        >
          {deleting ? 'Deleting…' : 'Delete account permanently'}
        </Button>
        {deleteMsg ? <p className="settings-msg settings-msg--error">{deleteMsg}</p> : null}
      </section>
    </SettingsDetailShell>
  )
}
