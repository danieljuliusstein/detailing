import { authenticateServerPocketBase } from './pocketbase-admin'
import { getAppNotifications, sendPushNotification } from './push'

export type NotificationType =
  | 'job_reminder'
  | 'morning_reminder'
  | 'follow_up'
  | 'invoice_overdue'
  | 'low_inventory'

export interface CronResult {
  created: number
  pushed: number
  pushFailed: number
  details: string[]
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return fmtDate(d)
}

function today(): string {
  return fmtDate(new Date())
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return fmtDate(d)
}

async function notificationExists(
  pb: Awaited<ReturnType<typeof authenticateServerPocketBase>>,
  type: NotificationType,
  referenceId: string,
  scheduledFor: string
): Promise<boolean> {
  const records = await pb.collection('notifications_log').getFullList({
    filter: `type = "${type}" && reference_id = "${referenceId}" && scheduled_for = "${scheduledFor}"`,
    limit: 1,
  })
  return records.length > 0
}

async function createNotification(
  pb: Awaited<ReturnType<typeof authenticateServerPocketBase>>,
  type: NotificationType,
  referenceId: string,
  scheduledFor: string
): Promise<boolean> {
  if (await notificationExists(pb, type, referenceId, scheduledFor)) return false

  await pb.collection('notifications_log').create({
    type,
    reference_id: referenceId,
    scheduled_for: scheduledFor,
    status: 'pending',
  })
  return true
}

const typeToSetting: Record<NotificationType, keyof Awaited<ReturnType<typeof getAppNotifications>>> = {
  job_reminder: 'job_reminder',
  morning_reminder: 'morning_reminder',
  follow_up: 'follow_up',
  invoice_overdue: 'invoice_overdue',
  low_inventory: 'low_inventory',
}

export async function runNotificationsCron(): Promise<CronResult> {
  const pb = await authenticateServerPocketBase()
  const settings = await getAppNotifications()
  const result: CronResult = { created: 0, pushed: 0, pushFailed: 0, details: [] }

  const tmr = tomorrow()
  const td = today()

  // Job reminders — jobs scheduled for tomorrow
  if (settings.job_reminder !== false) {
    const jobs = await pb.collection('jobs').getFullList({
      filter: `date = "${tmr}" && status = "scheduled"`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, 'job_reminder', job.id, tmr)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotification({
          title: 'Job tomorrow',
          body: `${client?.name ?? 'Client'} — ${job.date}`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`job_reminder: ${job.id}`)
      }
    }
  }

  // Morning reminder — jobs scheduled today
  if (settings.morning_reminder !== false) {
    const jobs = await pb.collection('jobs').getFullList({
      filter: `date = "${td}" && (status = "scheduled" || status = "in_progress")`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, 'morning_reminder', job.id, td)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotification({
          title: "Today's jobs",
          body: `${client?.name ?? 'Client'} scheduled today`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
      }
    }
  }

  // Follow-up — completed jobs from 3 days ago
  if (settings.follow_up !== false) {
    const cutoff = daysAgo(3)
    const jobs = await pb.collection('jobs').getFullList({
      filter: `date = "${cutoff}" && status = "completed"`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, 'follow_up', job.id, td)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotification({
          title: 'Follow up',
          body: `Check in with ${client?.name ?? 'client'} — job 3 days ago`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
      }
    }
  }

  // Invoice overdue — sent 3+ days ago, still unpaid
  if (settings.invoice_overdue !== false) {
    const cutoff = daysAgo(3)
    const invoices = await pb.collection('invoices').getFullList({
      filter: `(status = "sent" || status = "partial" || status = "overdue") && sent_at != "" && sent_at <= "${cutoff}"`,
    })
    for (const inv of invoices) {
      const created = await createNotification(pb, 'invoice_overdue', inv.id, td)
      if (created) {
        result.created++
        await pb.collection('invoices').update(inv.id, { status: 'overdue' })
        const push = await sendPushNotification({
          title: 'Invoice overdue',
          body: `${inv.invoice_number} — $${Number(inv.balance_due ?? inv.total).toFixed(2)} due`,
          url: `/jobs/${inv.job_id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`invoice_overdue: ${inv.invoice_number}`)
      }
    }
  }

  // Low inventory
  if (settings.low_inventory !== false) {
    const supplies = await pb.collection('supplies').getFullList()
    for (const supply of supplies) {
      const qty = Number(supply.quantity_on_hand ?? 0)
      const threshold = Number(supply.reorder_threshold ?? 0)
      if (threshold <= 0 || qty > threshold) continue

      const created = await createNotification(pb, 'low_inventory', supply.id, td)
      if (created) {
        result.created++
        const push = await sendPushNotification({
          title: 'Low inventory',
          body: `${supply.name}: ${qty} ${supply.unit} on hand`,
          url: '/inventory',
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`low_inventory: ${supply.name}`)
      }
    }
  }

  // Mark pending notifications_log entries as sent
  const pending = await pb.collection('notifications_log').getFullList({
    filter: 'status = "pending"',
  })
  for (const entry of pending) {
    const settingKey = typeToSetting[entry.type as NotificationType]
    if (settingKey && settings[settingKey] === false) continue
    await pb.collection('notifications_log').update(entry.id, {
      status: 'sent',
      sent_at: new Date().toISOString().slice(0, 10),
    })
  }

  return result
}
