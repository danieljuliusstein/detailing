'use client'

import { useEffect, useRef, useState } from 'react'
import { FloatingField } from '@/components/forms'
import { Button } from '@/components/ui'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentOrganizationId } from '@/lib/tenant'
import { getPocketBase } from '@/lib/pocketbase'
import { saveSettingsToPocketBase, loadSettingsFromPocketBase } from '@/lib/api/settings-pocketbase'
import { getAllPackages } from '@/lib/api/pocketbase'
import { DEFAULT_INVOICE_TERMS } from '@/lib/settings'
import { markTourPending } from '@/lib/product-tour'
import WebsiteBookingGuide from '@/components/settings/WebsiteBookingGuide'
import type { Package } from '@/lib/types'

const STEPS = ['Your business', 'Your packages', 'Get booked'] as const

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [businessName, phone])

  useEffect(() => {
    void (async () => {
      try {
        const settings = await loadSettingsFromPocketBase()
        if (settings?.business_phone?.trim()) {
          router.replace('/')
          return
        }
        if (settings) {
          setPhone(settings.business_phone ?? '')
          setBusinessName(settings.business_name ?? '')
          if (settings.logo_url && settings.logo_url !== '/logo.png') {
            setLogoPreview(settings.logo_url)
          }
        }

        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (orgId && pb?.authStore.isValid) {
          const org = await pb.collection('organizations').getOne(orgId)
          setSlug(String(org.slug ?? ''))
        }

        const pkgs = await getAllPackages()
        setPackages(pkgs.filter((p) => p.active))
      } catch {
        // continue with empty state
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const bookingLink = slug ? `${appUrl}/book/${slug}` : ''

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const current = await loadSettingsFromPocketBase()
      if (!current) throw new Error('Could not load settings')
      await saveSettingsToPocketBase(
        {
          ...current,
          business_name: businessName.trim() || current.business_name,
          business_phone: phone.trim(),
          invoice_terms_footer: current.invoice_terms_footer?.trim()
            ? current.invoice_terms_footer
            : DEFAULT_INVOICE_TERMS,
        },
        logoFile
      )
      markTourPending()
      router.replace('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Loading…</div>
      </div>
    )
  }

  return (
    <div className="onboarding-screen">
      <header className="onboarding-screen__header">
        <p className="onboarding-screen__eyebrow">Welcome</p>
        <h1 className="onboarding-screen__title">Set up your business</h1>
        <p className="onboarding-screen__lead">
          Step {step} of {STEPS.length} — {STEPS[step - 1]}
        </p>
      </header>

      <div className="onboarding-progress" aria-hidden>
        {STEPS.map((_, i) => (
          <div key={i} className={`onboarding-progress__dot${step > i ? ' active' : ''}`} />
        ))}
      </div>

      {step === 1 ? (
        <section className="card onboarding-card">
          <h2 className="onboarding-card__title">Your business</h2>
          <p className="onboarding-screen__lead" style={{ marginBottom: 12 }}>
            This name and logo appear on invoices, your booking page, and the client portal.
          </p>
          <div ref={formRef} className="page-form">
            <FloatingField id="onboarding-business-name" label="Business name" filled={businessName.trim().length > 0}>
              <input
                id="onboarding-business-name"
                type="text"
                className={`f-input${businessName.trim() ? ' hv' : ''}`}
                placeholder=" "
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoComplete="organization"
              />
            </FloatingField>
            <FloatingField id="onboarding-phone" label="Business phone" filled={phone.trim().length > 0}>
              <input
                id="onboarding-phone"
                type="tel"
                className={`f-input${phone.trim() ? ' hv' : ''}`}
                placeholder=" "
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </FloatingField>
          </div>
          <div className="onboarding-logo-block">
            <span className="onboarding-field-label">Logo (optional)</span>
            {logoPreview ? (
              <img src={logoPreview} alt="" className="onboarding-logo-preview" />
            ) : null}
            <label htmlFor="onboarding-logo" className="btn-ghost onboarding-logo-btn">
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </label>
            <input
              id="onboarding-logo"
              type="file"
              accept="image/*"
              className="onboarding-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setLogoFile(file)
                if (file) {
                  setLogoPreview(URL.createObjectURL(file))
                }
              }}
            />
          </div>
          <div className="onboarding-actions">
            <Button type="button" disabled={!phone.trim() || !businessName.trim()} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="card onboarding-card">
          <h2 className="onboarding-card__title">Your packages</h2>
          <p className="onboarding-screen__lead" style={{ marginBottom: 12 }}>
            These services are ready for customers to book. Confirm prices before you go live.
          </p>
          <ul className="onboarding-package-list">
            {packages.length ? (
              packages.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span>{formatPrice(p.base_price)}</span>
                </li>
              ))
            ) : (
              <li>Default packages seeded</li>
            )}
          </ul>
          <p className="onboarding-screen__lead" style={{ marginTop: 12, marginBottom: 0 }}>
            <Link href="/settings/packages">Edit packages in Settings</Link>
          </p>
          <div className="onboarding-actions">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="card onboarding-card onboarding-card--hero">
          <p className="onboarding-screen__eyebrow">Your booking link</p>
          <h2 className="onboarding-card__title">Get customers booked</h2>
          <p className="onboarding-screen__lead onboarding-card__lead">
            Copy your link and share it anywhere — Instagram bio, Google Business, or your existing site.
          </p>

          {slug && appUrl && bookingLink ? (
            <WebsiteBookingGuide
              appOrigin={appUrl}
              slug={slug}
              bookingUrl={bookingLink}
              brandName={businessName}
              compact
            />
          ) : (
            <p className="onboarding-screen__lead">Your booking options will appear after setup completes.</p>
          )}

          {error ? <p className="auth-error onboarding-card__error">{error}</p> : null}

          <p className="onboarding-trial-note">Your 14-day trial starts when you finish setup.</p>

          <div className="onboarding-actions onboarding-actions--finish">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={saving || !phone.trim() || !businessName.trim()}
              onClick={() => void finish()}
            >
              {saving ? 'Saving…' : 'Go to dashboard'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { markTourPending(); router.replace('/') }}>
              Skip for now
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
