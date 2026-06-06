import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, clientName, invoiceNumber, total, businessName, fromEmail, portalUrl } = body

    if (!to || !invoiceNumber || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'Email not configured — set RESEND_API_KEY in .env.local' },
        { status: 503 }
      )
    }

    const from = process.env.RESEND_FROM_EMAIL ?? fromEmail ?? 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: `${businessName} <${from}>`,
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
        <p>Hi ${clientName ?? 'there'},</p>
        <p>Your invoice <strong>${invoiceNumber}</strong> for <strong>$${Number(total).toFixed(2)}</strong> is ready.</p>
        <p>Payment is due on receipt.</p>
        ${portalUrl ? `<p><a href="${portalUrl}">View your invoice online</a></p>` : ''}
        <p>— ${businessName}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Send failed' },
      { status: 500 }
    )
  }
}
