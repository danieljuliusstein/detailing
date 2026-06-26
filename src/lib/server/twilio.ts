import twilio from 'twilio'

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  )
}

export async function sendSms(to: string, body: string): Promise<{ ok: true; sid: string } | { ok: false; error: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_FROM_NUMBER?.trim()

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: 'Twilio is not configured' }
  }

  const normalizedTo = to.replace(/\D/g, '')
  if (normalizedTo.length < 10) {
    return { ok: false, error: 'Invalid phone number' }
  }

  const e164 = normalizedTo.length === 10 ? `+1${normalizedTo}` : `+${normalizedTo}`

  try {
    const client = twilio(accountSid, authToken)
    const message = await client.messages.create({ to: e164, from, body })
    return { ok: true, sid: message.sid }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMS failed' }
  }
}
