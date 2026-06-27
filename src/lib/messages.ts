import { scopedStorageKey } from './tenant'

export type SentMessageStatus = 'sent' | 'failed'
export type SentMessageChannel = 'sms' | 'email'

export interface AutoMessageTemplate {
  id: string
  name: string
  trigger: string
  enabled: boolean
  emailBody: string
}

export interface SentMessage {
  id: string
  client_name: string
  preview: string
  body: string
  channel: SentMessageChannel
  sent_at: string
  status: SentMessageStatus
}

const STORAGE_KEY = 'detailing_auto_messages_v1'

export const PREVIEW_CLIENT = {
  name: 'Sarah',
  package: 'Full Detail',
  time: '9:00 AM',
  date: 'Jun 6',
}

export const DEFAULT_AUTO_TEMPLATES: AutoMessageTemplate[] = [
  {
    id: 'appointment_reminder',
    name: 'Appointment reminder',
    trigger: '24 hours before appointment',
    enabled: true,
    emailBody:
      'Hi {{name}},\n\nThis is a reminder that your {{package}} appointment is scheduled for {{date}} at {{time}}.\n\nView your portal: {{portal_link}}',
  },
  {
    id: 'job_completion',
    name: 'Job completion',
    trigger: 'When job is marked complete',
    enabled: true,
    emailBody:
      'Hi {{name}},\n\nYour {{package}} service is now complete. We hope you love the results!\n\nView photos: {{portal_link}}',
  },
  {
    id: 'review_request',
    name: 'Review request',
    trigger: '24 hours after completion',
    enabled: false,
    emailBody:
      'Hi {{name}},\n\nThank you for trusting us with your {{package}}. If you have a moment, we would appreciate a review.\n\nLeave a review: {{review_link}}',
  },
  {
    id: 'follow_up',
    name: 'Follow-up',
    trigger: '30 days after last service',
    enabled: false,
    emailBody:
      'Hi {{name}},\n\nIt has been about 30 days since your last {{package}}. Reply or book your next visit when you are ready.',
  },
]

export function loadAutoMessageTemplates(): AutoMessageTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY))
  if (!raw) return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  try {
    const parsed = JSON.parse(raw) as { id: string; enabled?: boolean }[]
    return DEFAULT_AUTO_TEMPLATES.map((def) => {
      const saved = parsed.find((p) => p.id === def.id)
      return saved ? { ...def, enabled: saved.enabled ?? def.enabled } : { ...def }
    })
  } catch {
    return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  }
}

export function saveAutoMessageTemplates(templates: AutoMessageTemplate[]): void {
  if (typeof window === 'undefined') return
  const payload = templates.map(({ id, enabled }) => ({ id, enabled }))
  localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(payload))
}

export async function loadAutoMessageTemplatesAsync(): Promise<AutoMessageTemplate[]> {
  if (typeof window !== 'undefined') {
    try {
      const { loadAutoMessageTemplatesFromPocketBase } = await import('./api/messages-pocketbase')
      const remote = await loadAutoMessageTemplatesFromPocketBase()
      if (remote) return remote
    } catch {
      // fall through to local storage
    }
  }
  return loadAutoMessageTemplates()
}

export async function saveAutoMessageTemplatesAsync(templates: AutoMessageTemplate[]): Promise<void> {
  saveAutoMessageTemplates(templates)
  if (typeof window !== 'undefined') {
    try {
      const { saveAutoMessageTemplatesToPocketBase } = await import('./api/messages-pocketbase')
      await saveAutoMessageTemplatesToPocketBase(templates)
    } catch {
      // local copy already saved
    }
  }
}

export async function loadSentMessagesAsync(): Promise<SentMessage[]> {
  if (typeof window !== 'undefined') {
    try {
      const { loadSentMessagesFromPocketBase } = await import('./api/messages-pocketbase')
      const remote = await loadSentMessagesFromPocketBase()
      if (remote) return remote
    } catch {
      // fall through
    }
  }
  return []
}

export function mergeTemplateBody(template: string): string {
  return template
    .replace(/\{\{name\}\}/g, PREVIEW_CLIENT.name)
    .replace(/\{\{package\}\}/g, PREVIEW_CLIENT.package)
    .replace(/\{\{time\}\}/g, PREVIEW_CLIENT.time)
    .replace(/\{\{date\}\}/g, PREVIEW_CLIENT.date)
    .replace(/\{\{portal_link\}\}/g, 'https://detailing.app/portal/example')
    .replace(/\{\{review_link\}\}/g, 'https://g.page/review')
}

export const AUTO_MESSAGE_HINT =
  'Sends by email when the client has an email on file. To text manually, use Text on the client profile.'

export function formatMessageTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
