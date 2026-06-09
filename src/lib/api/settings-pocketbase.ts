import { getPocketBase, isPocketBaseConfigured } from '../pocketbase'
import { checkPocketBaseHealth } from '../pocketbase'
import { authenticatePocketBase } from '../pb-auth'
import type { AppSettings } from '../settings'
import type { PbRecord } from './mappers'

const SETTINGS_RECORD_ID_KEY = 'detailing_app_settings_id'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function notificationsFromRecord(raw: unknown): AppSettings['notifications'] {
  const defaults: AppSettings['notifications'] = {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  }
  if (typeof raw !== 'object' || raw === null) return defaults
  const n = raw as Record<string, unknown>
  return {
    job_reminder: n.job_reminder !== false,
    morning_reminder: n.morning_reminder !== false,
    follow_up: n.follow_up !== false,
    invoice_overdue: n.invoice_overdue !== false,
    low_inventory: n.low_inventory !== false,
  }
}

function recordToSettings(record: PbRecord, logoUrl?: string): AppSettings {
  const notifications = notificationsFromRecord(record.notifications)
  return {
    business_name: String(record.business_name ?? ''),
    business_phone: String(record.business_phone ?? ''),
    business_email: String(record.business_email ?? ''),
    business_address: String(record.business_address ?? ''),
    invoice_terms_footer: String(record.invoice_terms_footer ?? ''),
    notifications,
    last_backup_at: record.last_backup_at ? String(record.last_backup_at) : undefined,
    logo_url: logoUrl,
    pb_record_id: record.id,
  }
}

export async function canSyncSettings(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  if (!(await checkPocketBaseHealth())) return false
  return authenticatePocketBase()
}

export async function loadSettingsFromPocketBase(): Promise<AppSettings | null> {
  if (!(await canSyncSettings())) return null

  try {
    const records = await pb().collection('app_settings').getFullList<PbRecord>({ limit: 1 })
    if (records.length === 0) return null

    const record = records[0]
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_RECORD_ID_KEY, record.id)
    }

    let logoUrl: string | undefined
    const logo = record.logo
    if (typeof logo === 'string' && logo) {
      logoUrl = '/api/business-logo'
    } else {
      logoUrl = '/logo.png'
    }

    return recordToSettings(record, logoUrl)
  } catch {
    return null
  }
}

export async function saveSettingsToPocketBase(
  settings: AppSettings,
  logoFile?: File | null
): Promise<AppSettings> {
  if (!(await canSyncSettings())) throw new Error('PocketBase not available')

  const storedId = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_RECORD_ID_KEY) : null
  const notifications = { ...settings.notifications }

  const payload: Record<string, unknown> = {
    business_name: settings.business_name,
    business_phone: settings.business_phone,
    business_email: settings.business_email,
    business_address: settings.business_address,
    invoice_terms_footer: settings.invoice_terms_footer,
    notifications,
  }
  if (settings.last_backup_at) {
    payload.last_backup_at = settings.last_backup_at.slice(0, 10)
  }

  let record: PbRecord

  if (logoFile) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'notifications') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value ?? ''))
      }
    }
    formData.append('logo', logoFile)

    if (storedId) {
      record = await pb().collection('app_settings').update<PbRecord>(storedId, formData)
    } else {
      record = await pb().collection('app_settings').create<PbRecord>(formData)
    }
  } else if (storedId) {
    record = await pb().collection('app_settings').update<PbRecord>(storedId, payload)
  } else {
    const existing = await pb().collection('app_settings').getFullList<PbRecord>({ limit: 1 })
    if (existing.length > 0) {
      record = await pb().collection('app_settings').update<PbRecord>(existing[0].id, payload)
    } else {
      record = await pb().collection('app_settings').create<PbRecord>(payload)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_RECORD_ID_KEY, record.id)
  }

  let logoUrl: string | undefined
  const logo = record.logo
  logoUrl = typeof logo === 'string' && logo ? '/api/business-logo' : '/logo.png'

  return recordToSettings(record, logoUrl)
}
