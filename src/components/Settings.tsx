'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, FloppyDisk } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
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
import {
  buildLocalExport,
  downloadJson,
  runNotificationsCheck,
  triggerServerBackup,
} from '@/lib/export-data'
import {
  isPushEnabled,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client'
import { loadSettingsAsync, saveSettingsAsync, type AppSettings } from '@/lib/settings'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 13, background: on ? 'var(--green)' : 'var(--bg-surface-hover)',
      border: '0.5px solid var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: on ? '#071407' : 'var(--text-dim)',
        position: 'absolute', top: 2, left: on ? 22 : 2, transition: 'left 150ms ease',
      }} />
    </div>
  )
}

export default function Settings() {
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const [backend, setBackend] = useState<'local' | 'pocketbase' | '…'>('…')
  const [migration, setMigration] = useState<MigrationStatus | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [migrationMsg, setMigrationMsg] = useState<string | null>(null)
  const [pushOn, setPushOn] = useState(false)
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [cronMsg, setCronMsg] = useState<string | null>(null)

  const refreshSync = async () => {
    const [b, m, s] = await Promise.all([getActiveBackend(), getMigrationStatus(), getSyncStatus()])
    setBackend(b)
    setMigration(m)
    setSyncStatus(s)
  }

  useEffect(() => {
    loadSettingsAsync().then(setSettings)
    refreshSync()
    setPushOn(isPushEnabled())
  }, [])

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!settings) return
    const savedSettings = await saveSettingsAsync(settings, logoFile)
    setSettings(savedSettings)
    setLogoFile(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleMigrate = async () => {
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

  const handleExport = () => {
    const bundle = buildLocalExport()
    downloadJson(bundle, `detailing-export-${bundle.exported_at.slice(0, 10)}.json`)
  }

  const handleBackup = async () => {
    setBackingUp(true)
    setBackupMsg(null)
    try {
      const result = await triggerServerBackup()
      if (result.ok && settings) {
        const updated = { ...settings, last_backup_at: new Date().toISOString() }
        const savedSettings = await saveSettingsAsync(updated)
        setSettings(savedSettings)
        setBackupMsg('PocketBase backup downloaded')
      } else {
        setBackupMsg(result.error ?? 'Backup failed')
      }
    } finally {
      setBackingUp(false)
    }
  }

  const handlePushToggle = async () => {
    setPushMsg(null)
    if (pushOn) {
      await unsubscribeFromPush()
      setPushOn(false)
      setPushMsg('Push notifications disabled')
      return
    }
    const result = await subscribeToPush()
    if (result.ok) {
      setPushOn(true)
      setPushMsg('Push notifications enabled')
    } else {
      setPushMsg(result.error ?? 'Failed to enable push')
    }
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

  if (!settings) {
    return <div className="screen page-content" style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 22, fontWeight: 600 }}>Settings</div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Data backend</span>
          <span className={`badge ${backend === 'pocketbase' ? 'badge-paid' : 'badge-draft'}`}>
            {backend === '…' ? 'Checking…' : backend === 'pocketbase' ? 'PocketBase' : 'Local storage'}
          </span>
        </div>
        {backend === 'local' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.45, marginBottom: 8 }}>
              Showing data stored on this device only. Connect to PocketBase to load your real jobs and clients.
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={async () => {
                await clearLocalDeviceData()
                resetBackend()
                await refreshSync()
                window.location.reload()
              }}
            >
              Reconnect to cloud
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', fontSize: 12, color: 'var(--text-muted)' }}
              onClick={async () => {
                if (!confirm('Clear all data stored on this device? Your cloud data on PocketBase is not deleted.')) return
                await clearLocalDeviceData()
                resetBackend()
                window.location.reload()
              }}
            >
              Clear local device data
            </button>
          </div>
        )}
      </div>

      <div className="section-title">Business</div>
      <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Logo</div>
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Business logo" style={{ maxHeight: 48, marginBottom: 8, borderRadius: 4 }} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 13, color: 'var(--text-muted)' }}
          />
        </div>
        {([
          ['business_name', 'Business name'],
          ['business_phone', 'Phone'],
          ['business_email', 'Email'],
          ['business_address', 'Address'],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <input className="input" value={settings[key]} onChange={(e) => update(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="section-title">Invoicing</div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Terms footer</div>
        <textarea className="input" rows={3} value={settings.invoice_terms_footer}
          onChange={(e) => update('invoice_terms_footer', e.target.value)} style={{ resize: 'vertical' }} />
      </div>

      <div className="section-title">Notifications</div>
      <div className="card" style={{ marginBottom: 20 }}>
        {([
          ['job_reminder', 'Job reminder (day before)'],
          ['morning_reminder', 'Morning reminder'],
          ['follow_up', 'Follow-up (3 days after)'],
          ['invoice_overdue', 'Invoice overdue'],
          ['low_inventory', 'Low inventory'],
        ] as const).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>{label}</span>
            <Toggle on={settings.notifications[key]} onChange={(v) => update('notifications', { ...settings.notifications, [key]: v })} />
          </div>
        ))}
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14 }}>Push notifications</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {isPushSupported() ? (pushOn ? 'Subscribed' : 'Not subscribed') : 'Not supported on this device'}
            </div>
          </div>
          <Toggle on={pushOn} onChange={() => handlePushToggle()} />
        </div>
        {pushMsg && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{pushMsg}</div>}
        <button className="btn-ghost" onClick={handleRunCron} style={{ width: '100%', fontSize: 13 }}>
          Run notification check now
        </button>
        {cronMsg && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{cronMsg}</div>}
      </div>

      <div className="section-title">Operations</div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          className="card-pressable"
          onClick={() => router.push('/inventory')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>Inventory</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
        <div className="divider" />
        <div
          className="card-pressable"
          onClick={() => router.push('/settings/overhead')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>Overhead expenses</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
        <div className="divider" />
        <div
          className="card-pressable"
          onClick={() => router.push('/settings/business-expenses')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>Business expenses</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
        <div className="divider" />
        <div
          className="card-pressable"
          onClick={() => router.push('/settings/packages')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>Service packages</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
        <div className="divider" />
        <div
          className="card-pressable"
          onClick={() => router.push('/invoices')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>All invoices</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
      </div>

      <div className="section-title">Sync & migration</div>
      <div className="card" style={{ marginBottom: 20 }}>
        {migration && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Local: {migration.localJobCount} jobs, {migration.localClientCount} clients
            {migration.pocketBaseJobCount != null && ` · PocketBase: ${migration.pocketBaseJobCount} jobs`}
            {migration.migrated && ' · Migrated'}
          </div>
        )}
        {syncStatus && syncStatus.pendingWrites > 0 && (
          <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 10 }}>
            {syncStatus.pendingWrites} pending write{syncStatus.pendingWrites === 1 ? '' : 's'} in offline queue
          </div>
        )}
        {syncErrors.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10, lineHeight: 1.5 }}>
            {syncErrors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
        {migrationMsg && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{migrationMsg}</div>
        )}
        <button
          className="btn-ghost"
          onClick={handleMigrate}
          disabled={
            migrating ||
            (migration?.migrated === true &&
              migration.pocketBaseJobCount != null &&
              migration.localJobCount <= migration.pocketBaseJobCount)
          }
          style={{ width: '100%', marginBottom: 8 }}
        >
          {migrating
            ? 'Migrating…'
            : migration?.migrated && migration.pocketBaseJobCount != null && migration.localJobCount <= migration.pocketBaseJobCount
              ? 'Migration complete'
              : 'Migrate local data to PocketBase'}
        </button>
        <button
          className="btn-ghost"
          onClick={handleSyncNow}
          disabled={syncing || !syncStatus?.pendingWrites}
          style={{ width: '100%', marginBottom: 8 }}
        >
          {syncing ? 'Syncing…' : 'Sync pending changes'}
        </button>
        {syncStatus && syncStatus.pendingWrites > 0 && (
          <button className="btn-ghost" onClick={handleClearQueue} style={{ width: '100%', fontSize: 12, color: 'var(--red)' }}>
            Clear sync queue
          </button>
        )}
      </div>

      <div className="section-title">Data</div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          className="card-pressable"
          onClick={() => router.push('/settings/change-pin')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: '10px 0', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 14 }}>Change PIN</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </div>
        <div className="divider" />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Last backup: {settings.last_backup_at ? new Date(settings.last_backup_at).toLocaleDateString() : 'Never'}
        </div>
        <button className="btn-ghost" onClick={handleBackup} disabled={backingUp} style={{ width: '100%', marginBottom: 8 }}>
          {backingUp ? 'Backing up…' : 'Backup now (PocketBase)'}
        </button>
        <button className="btn-ghost" onClick={handleExport} style={{ width: '100%', marginBottom: 8 }}>
          Export all data (local)
        </button>
        <button
          className="btn-ghost"
          style={{ width: '100%', fontSize: 12, color: 'var(--text-muted)' }}
          onClick={async () => {
            if (!confirm('Clear demo and cached data on this device? Cloud data on PocketBase is not deleted.')) return
            await clearLocalDeviceData()
            resetBackend()
            window.location.reload()
          }}
        >
          Clear local device data
        </button>
        {backupMsg && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{backupMsg}</div>}
      </div>

      <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <FloppyDisk size={18} weight="bold" />
        {saved ? 'Saved!' : 'Save settings'}
      </button>
    </div>
  )
}
