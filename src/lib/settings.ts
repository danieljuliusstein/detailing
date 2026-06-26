const SETTINGS_KEY = 'detailing_settings_v1'

export interface AppSettings {
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  invoice_terms_footer: string
  notifications: {
    job_reminder: boolean
    morning_reminder: boolean
    follow_up: boolean
    invoice_overdue: boolean
    low_inventory: boolean
  }
  last_backup_at?: string
  logo_url?: string
  pb_record_id?: string
}

export const DEFAULT_INVOICE_TERMS = 'Due on receipt. Thank you for your business.'

const DEFAULTS: AppSettings = {
  business_name: 'Your Detailing Co.',
  business_phone: '',
  business_email: '',
  business_address: '',
  invoice_terms_footer: DEFAULT_INVOICE_TERMS,
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return { ...DEFAULTS }
  return { ...DEFAULTS, ...JSON.parse(raw) }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export async function loadSettingsAsync(): Promise<AppSettings> {
  const local = loadSettings()
  if (typeof window === 'undefined') return local

  try {
    const { loadSettingsFromPocketBase } = await import('./api/settings-pocketbase')
    const remote = await loadSettingsFromPocketBase()
    if (remote) {
      const merged = { ...local, ...remote, notifications: { ...local.notifications, ...remote.notifications } }
      saveSettings(merged)
      return merged
    }
  } catch {
    // fall back to local
  }
  return local
}

export async function saveSettingsAsync(
  settings: AppSettings,
  logoFile?: File | null,
  options?: { clearLogo?: boolean }
): Promise<AppSettings> {
  saveSettings(settings)
  if (typeof window === 'undefined') return settings

  try {
    const { saveSettingsToPocketBase } = await import('./api/settings-pocketbase')
    const saved = await saveSettingsToPocketBase(settings, logoFile, options)
    saveSettings(saved)
    return saved
  } catch (err) {
    console.warn('[settings] PocketBase sync failed:', err)
    return settings
  }
}
