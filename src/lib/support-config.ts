export interface SupportFaqItem {
  id: string
  question: string
  answer: string
}

export const SUPPORT_FAQ: SupportFaqItem[] = [
  {
    id: 'booking-link',
    question: 'How do I share my booking link?',
    answer:
      'Open Settings → Your business. Copy your booking link or use Preview to test it. Add the link to Instagram, Google Business, or your website. Set your schedule under Settings → Schedule & time off so clients only see open slots.',
  },
  {
    id: 'pipeline',
    question: 'How does the lead pipeline work?',
    answer:
      'Tap the grid icon on the home screen to open your pipeline. Add leads with + or when someone books online. Move leads through stages as they inquire, quote, and book — then convert them to clients when the job is scheduled.',
  },
  {
    id: 'online-payments',
    question: 'How do I accept payments online?',
    answer:
      'Go to Settings → Invoicing and connect Stripe. Complete Stripe onboarding in Safari or Chrome using your real business email. After setup, clients see Pay online on invoice portals and payments deposit to your Stripe account (separate from your Rinse subscription).',
  },
  {
    id: 'schedule',
    question: 'How do I set booking hours and time off?',
    answer:
      'Settings → Schedule & time off. Set weekly hours, lunch blocks, slot length, and travel rate per mile. Add time-off blocks for vacations or personal days — blocked times won’t appear on your public booking page.',
  },
  {
    id: 'auto-messages',
    question: 'What are auto messages?',
    answer:
      'Open Messages from the home header. Under Auto, turn on templates like appointment reminders and job completion emails. Each template sends when its trigger fires (for example, 24 hours before a job). View sent messages under All.',
  },
  {
    id: 'app-tour',
    question: 'How do I replay the app tour?',
    answer:
      'Settings → Help & support → Replay app tour. New accounts see the tour after onboarding. The walkthrough highlights your week view, jobs, clients, reports, pipeline, and settings.',
  },
  {
    id: 'milestones',
    question: 'What are progress milestones?',
    answer:
      'Settings → Your progress tracks real wins from running your business — first jobs, revenue milestones, and more. They unlock from your activity, not from opening the app.',
  },
  {
    id: 'backups',
    question: 'Where are backups and exports?',
    answer:
      'Go to Settings → Access and data. Use Backup now for a PocketBase download, or Export all data for a local JSON file on this device.',
  },
  {
    id: 'push',
    question: 'Push notifications not working?',
    answer:
      'Check Settings → App preferences and turn on Push notifications. Allow alerts when your browser asks. On iPhone, add the app to your Home Screen for reliable push.',
  },
  {
    id: 'sign-in',
    question: 'How do I sign in?',
    answer:
      'Use Sign in or Create account on the banner at the top of the app, or open Settings and choose Sign in. You need an account to load jobs, clients, and save changes.',
  },
  {
    id: 'portal',
    question: 'Customer can’t open a portal link?',
    answer:
      'Portal links expire for security. Open the job or quote in the app and send a fresh link from Share. Ask the customer to check spam if you emailed it.',
  },
  {
    id: 'offline',
    question: 'Data looks wrong or out of sync?',
    answer:
      'In Settings → Access and data, try Sync pending changes. If you are on local-only storage, use Reconnect to cloud. Contact support with debug info if issues continue.',
  },
]

export const APP_DISPLAY_NAME = 'Rinse'

/** Fallback when NEXT_PUBLIC_APP_VERSION is unset at build time. */
export const DEFAULT_APP_VERSION = '0.1.0'

export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION?.trim() || DEFAULT_APP_VERSION
}

export function getSupportEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  return email && email.includes('@') ? email : null
}

export interface SupportDebugInput {
  backend: string
  origin: string
  userAgent: string
  timestamp: string
  orgSlug?: string | null
  businessName?: string | null
}

export function buildDebugInfo(input: SupportDebugInput): string {
  const lines = [
    `${APP_DISPLAY_NAME} support debug info`,
    `Version: ${getAppVersion()}`,
    `Backend: ${input.backend}`,
    `Origin: ${input.origin}`,
    `Time: ${input.timestamp}`,
  ]
  if (input.businessName?.trim()) lines.push(`Business: ${input.businessName.trim()}`)
  if (input.orgSlug?.trim()) lines.push(`Org slug: ${input.orgSlug.trim()}`)
  lines.push(`User agent: ${input.userAgent}`)
  return lines.join('\n')
}

export function buildSupportMailto(options: {
  subject: string
  body?: string
}): string | null {
  const email = getSupportEmail()
  if (!email) return null

  const params = new URLSearchParams()
  if (options.subject) params.set('subject', options.subject)
  if (options.body) params.set('body', options.body)
  const query = params.toString()
  return `mailto:${email}${query ? `?${query}` : ''}`
}

export function buildContactMailto(): string | null {
  return buildSupportMailto({ subject: `${APP_DISPLAY_NAME} support` })
}

export function buildBugReportMailto(debugInfo: string): string | null {
  return buildSupportMailto({
    subject: `${APP_DISPLAY_NAME} support request`,
    body: `${debugInfo}\n\nDescribe the issue:\n`,
  })
}
