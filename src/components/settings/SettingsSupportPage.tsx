'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CaretRight, EnvelopeSimple } from '@phosphor-icons/react'
import { getActiveBackend } from '@/lib/api'
import { requestTourReplay, TOUR_REPLAY_EVENT } from '@/lib/product-tour'
import {
  APP_DISPLAY_NAME,
  buildBugReportMailto,
  buildContactMailto,
  buildDebugInfo,
  getAppVersion,
  getSupportEmail,
} from '@/lib/support-config'
import { loadOrganizationSlug } from '@/lib/tenant'
import { Button } from '@/components/ui'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsSupportPage() {
  const router = useRouter()
  const { settings, ready } = useSettingsDraft()
  const [backend, setBackend] = useState('unknown')
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const supportEmail = getSupportEmail()
  const contactMailto = buildContactMailto()

  useEffect(() => {
    void getActiveBackend().then((b) => setBackend(b))
    void loadOrganizationSlug().then(setOrgSlug)
  }, [])

  const debugInfo = useMemo(
    () =>
      buildDebugInfo({
        backend,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        orgSlug,
        businessName: settings?.business_name,
      }),
    [backend, orgSlug, settings?.business_name],
  )

  const bugMailto = buildBugReportMailto(debugInfo)

  const handleCopyDebug = async () => {
    setCopyMsg(null)
    try {
      await navigator.clipboard.writeText(debugInfo)
      setCopyMsg('Copied — paste into your support email')
    } catch {
      setCopyMsg('Could not copy — select and copy the text manually')
    }
  }

  const handleReplayTour = () => {
    requestTourReplay()
    router.push('/')
    window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))
  }

  if (!ready) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="Help & support" showSave={false}>
      <section className="card settings-support-contact">
        <h2 className="settings-support-contact__title">Contact us</h2>
        <p className="settings-support-contact__lead">
          Questions, bugs, or account help — we&apos;re here for you.
        </p>
        <p className="settings-support-contact__hint">We typically reply within 1 business day.</p>
        {contactMailto ? (
          <a href={contactMailto} className="btn-secondary settings-support-contact__btn">
            <EnvelopeSimple size={18} weight="bold" aria-hidden="true" />
            Email support
          </a>
        ) : (
          <p className="settings-msg settings-msg--warn">Support email not configured.</p>
        )}
        {supportEmail ? (
          <p className="settings-support-contact__email">{supportEmail}</p>
        ) : null}
      </section>

      <div className="settings-panel settings-panel--flush">
        <button type="button" className="settings-row-link" onClick={handleReplayTour}>
          <span>Replay app tour</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </button>
        <div className="settings-divider" />
        <Link href="/settings/faq#pipeline" className="settings-row-link settings-row-link--plain">
          <span>Lead pipeline</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <div className="settings-divider" />
        <Link href="/settings/faq#online-payments" className="settings-row-link settings-row-link--plain">
          <span>Online payments (Stripe)</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <div className="settings-divider" />
        <Link href="/settings/faq#schedule" className="settings-row-link settings-row-link--plain">
          <span>Booking schedule &amp; time off</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <div className="settings-divider" />
        <Link href="/settings/faq#auto-messages" className="settings-row-link settings-row-link--plain">
          <span>Auto messages</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <div className="settings-divider" />
        <Link href="/settings/faq" className="settings-row-link settings-row-link--plain">
          <span>All FAQ</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
        <div className="settings-divider" />
        <Link href="/privacy" className="settings-row-link settings-row-link--plain">
          <span>Privacy policy</span>
          <CaretRight size={16} color="var(--text-dim)" />
        </Link>
      </div>

      <section className="card settings-support-bug">
        <h2 className="settings-support-bug__title">Report a bug</h2>
        <p className="settings-support-bug__lead">
          Copy debug info and send it with a short description of what went wrong.
        </p>
        <Button type="button" variant="ghost" onClick={() => void handleCopyDebug()}>
          Copy debug info
        </Button>
        {bugMailto ? (
          <a href={bugMailto} className="btn-ghost settings-support-bug__email-link">
            Email support with debug info
          </a>
        ) : null}
        {copyMsg ? <p className="settings-msg">{copyMsg}</p> : null}
        <pre className="settings-support-bug__preview" aria-label="Debug info preview">
          {debugInfo}
        </pre>
      </section>

      <p className="settings-support-meta">
        {APP_DISPLAY_NAME} · v{getAppVersion()}
      </p>
    </SettingsDetailShell>
  )
}
