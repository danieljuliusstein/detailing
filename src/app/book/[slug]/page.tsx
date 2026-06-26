'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  EnvelopeSimple,
  House,
  MapPin,
  NotePencil,
  Phone,
  User,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { VehicleType } from '@/lib/types'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/vehicle-type-icons'

interface PublicPackage {
  id: string
  name: string
  base_price: number
  description?: string
}

interface AvailabilitySlot {
  time: string
  label: string
  available: boolean
}

interface PublicBusiness {
  name: string
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
}

function BookBrandMark({ business }: { business?: PublicBusiness | null }) {
  if (!business?.logoUrl) return null
  return (
    <div className="book-brand-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={business.logoUrl}
        alt=""
        className="book-brand-logo"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith('/logo.png')) e.currentTarget.src = '/logo.png'
        }}
      />
    </div>
  )
}

function bookFooterContact(business?: PublicBusiness | null): string | undefined {
  if (!business) return undefined
  if (business.email?.trim()) return business.email.trim()
  if (business.address?.trim()) return business.address.trim()
  return undefined
}

const BOOK_VEHICLE_TYPES = VEHICLE_TYPE_OPTIONS.filter((v) => v.id !== 'boat')

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDateBox(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeDisplay(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const dt = new Date()
  dt.setHours(h, m)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function BookDateField({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  value: string
  min: string
  max: string
  onChange: (value: string) => void
}) {
  return (
    <label className="book-datetime-box book-datetime-box--input" htmlFor={id}>
      <CalendarBlank size={18} color="var(--book-muted)" aria-hidden="true" />
      <input
        id={id}
        type="date"
        className="book-date-input"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function BookStickySummary({ name, price }: { name: string; price: number }) {
  return (
    <div className="book-sticky-summary" aria-live="polite">
      <span className="book-sticky-summary__name">{name}</span>
      <span className="book-sticky-summary__price">{formatPrice(price)}</span>
    </div>
  )
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="book-progress" aria-hidden>
      {[1, 2, 3].map((n) => (
        <div key={n} className={`book-progress-dot${step >= n ? ' active' : ''}`} />
      ))}
    </div>
  )
}

function BookPageShell({
  header,
  children,
  footerContact,
}: {
  header: ReactNode
  children: ReactNode
  footerContact?: string
}) {
  return (
    <div className="book-root client-light-root">
      <header className="book-header">{header}</header>
      <main className="book-body">{children}</main>
      <footer className="book-footer">
        {footerContact ? <p className="book-footer-contact">{footerContact}</p> : null}
        <p className="book-legal">
          <Link href="/privacy">Privacy policy</Link>
        </p>
      </footer>
    </div>
  )
}

function BookContent() {
  const params = useParams()
  const slug = String(params.slug ?? '')

  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [step, setStep] = useState(1)
  const [packages, setPackages] = useState<PublicPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packageId, setPackageId] = useState('')
  const [date, setDate] = useState('')
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string } | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<{
    packageName: string
    date: string
    startTime?: string
    customerEmail?: string
  } | null>(null)

  const apiBase = `/api/public/${encodeURIComponent(slug)}`
  const selectedPackage = useMemo(() => packages.find((p) => p.id === packageId), [packages, packageId])
  const minDate = dateBounds?.min ?? ''
  const maxDate = dateBounds?.max ?? ''

  const stepLabel = step === 1 ? 'Choose service' : step === 2 ? 'Date & time' : 'Your details'

  useEffect(() => {
    const today = todayIso()
    setDateBounds({ min: today, max: addDays(today, 60) })
    setDate((current) => current || today)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingPackages(true)
    setNotFound(false)
    setError('')
    Promise.all([fetch(`${apiBase}/business`), fetch(`${apiBase}/packages`)])
      .then(async ([bizRes, pkgsRes]) => {
        if (cancelled) return
        if (bizRes.status === 404 || pkgsRes.status === 404) {
          setNotFound(true)
          return
        }
        const [biz, pkgs] = await Promise.all([bizRes.json(), pkgsRes.json()])
        if (!bizRes.ok || !pkgsRes.ok) {
          setError(biz.error ?? pkgs.error ?? 'Could not load booking page')
          return
        }
        if (biz.business) setBusiness(biz.business)
        const list = pkgs.packages ?? []
        setPackages(list)
        if (list.length === 1) setPackageId(list[0].id)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load booking page')
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiBase])

  const loadSlots = useCallback(
    async (d: string) => {
      setLoadingSlots(true)
      setError('')
      try {
        const res = await fetch(`${apiBase}/availability?date=${encodeURIComponent(d)}`)
        const data = await res.json()
        setSlots(data.slots ?? [])
        setStartTime('')
      } catch {
        setSlots([])
        setError('Could not load availability')
      } finally {
        setLoadingSlots(false)
      }
    },
    [apiBase],
  )

  useEffect(() => {
    if (step >= 2 && date) void loadSlots(date)
  }, [step, date, loadSlots])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          date,
          startTime,
          locationType,
          vehicleType,
          name,
          phone,
          email: email || undefined,
          address: address || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      setConfirmed({
        packageName: data.booking.packageName,
        date: data.booking.date,
        startTime: data.booking.startTime,
        customerEmail: email.trim() || undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <BookPageShell
        header={
          <>
            <p className="book-eyebrow">Not found</p>
            <h1>Booking page not available</h1>
            <p className="book-lead">
              This link doesn&apos;t match an active detailing business. Check the URL or contact your detailer directly.
            </p>
          </>
        }
      >
        {null}
      </BookPageShell>
    )
  }

  if (confirmed) {
    return (
      <BookPageShell
        header={
          <>
            <BookBrandMark business={business} />
            <p className="book-eyebrow">Confirmed</p>
            <h1>You&apos;re booked</h1>
          </>
        }
        footerContact={bookFooterContact(business)}
      >
        <div className="book-success-banner">
          <CheckCircle size={32} weight="fill" className="book-success-icon" aria-hidden="true" />
          <p>
            <strong>{confirmed.packageName}</strong> on {formatDateBox(confirmed.date)}
            {confirmed.startTime ? ` at ${formatTimeDisplay(confirmed.startTime)}` : ''}.
          </p>
          {confirmed.customerEmail ? (
            <p>
              A confirmation will be sent to <strong>{confirmed.customerEmail}</strong> if email is enabled.
            </p>
          ) : (
            <p>{business?.name || 'Your detailer'} will confirm by phone or email if needed.</p>
          )}
          {business?.phone ? (
            <p>
              Questions? Call <a href={`tel:${business.phone.replace(/\D/g, '')}`}>{business.phone}</a>
            </p>
          ) : null}
        </div>
      </BookPageShell>
    )
  }

  return (
    <BookPageShell
      footerContact={bookFooterContact(business)}
      header={
        <>
          <BookBrandMark business={business} />
          <p className="book-eyebrow">Book online</p>
          <h1>{business?.name || 'Schedule a detail'}</h1>
          {business?.phone ? (
            <p className="book-phone">
              <Phone size={14} aria-hidden="true" />
              <a href={`tel:${business.phone.replace(/\D/g, '')}`}>{business.phone}</a>
            </p>
          ) : null}
          <p className="book-lead">
            Step {step} of 3 — {stepLabel}
          </p>
          <ProgressDots step={step} />
        </>
      }
    >
      {error ? <div className="book-error-banner" role="alert" aria-live="assertive">{error}</div> : null}

      {step === 1 ? (
        <section className="book-step-card">
          {loadingPackages ? (
            <p className="book-lead">Loading services…</p>
          ) : packages.length === 0 ? (
            <p className="book-lead">No services available right now. Please check back soon.</p>
          ) : (
            <div className="book-package-list">
              {packages.map((pkg) => {
                const selected = packageId === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`book-package-card${selected ? ' book-package-card--selected' : ''}`}
                    onClick={() => setPackageId(pkg.id)}
                  >
                    <span className="book-package-left">
                      <span className="book-package-name">{pkg.name}</span>
                      {pkg.description ? <span className="book-package-desc">{pkg.description}</span> : null}
                    </span>
                    <span className="book-package-right">
                      <span className="book-package-price">{formatPrice(pkg.base_price)}</span>
                      {selected ? (
                        <CheckCircle size={18} weight="fill" color="var(--book-green)" aria-hidden="true" />
                      ) : (
                        <Circle size={18} color="var(--book-border-hi)" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="book-step-actions book-step-actions--end">
            <button type="button" className="book-btn book-btn-primary" disabled={!packageId} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="book-step-card">
          {selectedPackage ? (
            <BookStickySummary name={selectedPackage.name} price={selectedPackage.base_price} />
          ) : null}

          <p className="book-label">Date</p>
          <div className="book-datetime-grid book-datetime-grid--step2">
            {dateBounds ? (
              <BookDateField
                id="book-date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={setDate}
              />
            ) : (
              <div className="book-datetime-box book-datetime-box--static">
                <CalendarBlank size={18} color="var(--book-muted)" aria-hidden="true" />
                <span className="book-datetime-value book-datetime-value--empty">Pick a date</span>
              </div>
            )}
          </div>

          <p className="book-label book-label--spaced">Pick a time</p>
          {startTime ? (
            <p className="book-selected-time">
              <Clock size={16} weight="fill" color="var(--book-green)" aria-hidden="true" />
              <span>Selected: {formatTimeDisplay(startTime)}</span>
            </p>
          ) : null}
          {loadingSlots ? (
            <p className="book-lead">Loading times…</p>
          ) : (
            <div className="book-slots-grid">
              {slots.map((slot) => {
                const className = [
                  'book-slot',
                  !slot.available ? 'taken' : '',
                  startTime === slot.time ? ' active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                if (!slot.available) {
                  return (
                    <span key={slot.time} className={className}>
                      {slot.label}
                    </span>
                  )
                }
                return (
                  <button key={slot.time} type="button" className={className} onClick={() => setStartTime(slot.time)}>
                    {slot.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="book-step-actions">
            <button type="button" className="book-btn book-btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="book-btn book-btn-primary" disabled={!startTime} onClick={() => setStep(3)}>
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="book-step-card">
          {selectedPackage ? (
            <BookStickySummary name={selectedPackage.name} price={selectedPackage.base_price} />
          ) : null}

          {date && startTime ? (
            <div className="book-datetime-grid book-datetime-grid--summary">
              <div className="book-datetime-box book-datetime-box--static">
                <CalendarBlank size={18} color="var(--book-muted)" aria-hidden="true" />
                <span className="book-datetime-value">{formatDateBox(date)}</span>
              </div>
              <div className="book-datetime-box book-datetime-box--static">
                <Clock size={18} color="var(--book-muted)" aria-hidden="true" />
                <span className="book-datetime-value">{formatTimeDisplay(startTime)}</span>
              </div>
            </div>
          ) : null}

          <p className="book-label">Contact</p>
          <div className="book-field">
            <label htmlFor="book-name">Name</label>
            <div className="book-input-wrap">
              <User size={16} className="book-input-icon" aria-hidden="true" />
              <input
                id="book-name"
                className="book-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="book-field">
            <label htmlFor="book-phone">Phone</label>
            <div className="book-input-wrap">
              <Phone size={16} className="book-input-icon" aria-hidden="true" />
              <input
                id="book-phone"
                type="tel"
                className="book-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="book-field">
            <label htmlFor="book-email">
              Email <span className="book-optional">optional</span>
            </label>
            <div className="book-input-wrap">
              <EnvelopeSimple size={16} className="book-input-icon" aria-hidden="true" />
              <input
                id="book-email"
                type="email"
                className="book-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="book-field">
            <label htmlFor="book-address">Service address</label>
            <div className="book-input-wrap">
              <MapPin size={16} className="book-input-icon" aria-hidden="true" />
              <input
                id="book-address"
                className="book-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city"
              />
            </div>
          </div>

          <button
            type="button"
            className="book-more-options-toggle"
            aria-expanded={showMoreOptions}
            onClick={() => setShowMoreOptions((open) => !open)}
          >
            {showMoreOptions ? 'Fewer options' : 'More options'}
            <span className="book-more-options-hint">vehicle, location, notes</span>
          </button>

          {showMoreOptions ? (
            <>
          <p className="book-label book-label--spaced">Vehicle type</p>
          <div className="book-vehicle-grid">
            {BOOK_VEHICLE_TYPES.map((v) => {
              const active = vehicleType === v.id
              const { Icon } = v
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`book-vehicle-btn${active ? ' book-vehicle-btn--selected' : ''}`}
                  onClick={() => setVehicleType(v.id)}
                >
                  <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>{v.label}</span>
                </button>
              )
            })}
          </div>

          <p className="book-label book-label--spaced">Location</p>
          <div className="book-location-toggle">
            <button
              type="button"
              className={`book-location-opt${locationType === 'mobile' ? ' book-location-opt--selected' : ''}`}
              onClick={() => setLocationType('mobile')}
            >
              <MapPin size={15} aria-hidden="true" />
              We come to you
            </button>
            <button
              type="button"
              className={`book-location-opt${locationType === 'fixed' ? ' book-location-opt--selected' : ''}`}
              onClick={() => setLocationType('fixed')}
            >
              <House size={15} aria-hidden="true" />
              Drop-off location
            </button>
          </div>

          <div className="book-field book-field--notes">
            <label htmlFor="book-notes">
              Notes <span className="book-optional">optional</span>
            </label>
            <div className="book-notes-box">
              <NotePencil size={16} className="book-notes-icon" aria-hidden="true" />
              <textarea
                id="book-notes"
                className="book-notes-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, parking, pet hair…"
              />
            </div>
          </div>
            </>
          ) : null}

          <div className="book-step-actions">
            <button type="button" className="book-btn book-btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="book-btn book-btn-primary"
              disabled={submitting || !name.trim() || !phone.trim() || !packageId}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Booking…' : 'Confirm booking →'}
            </button>
          </div>
        </section>
      ) : null}
    </BookPageShell>
  )
}

export default function PublicBookPage() {
  return (
    <Suspense
      fallback={
        <div className="book-root client-light-root">
          <header className="book-header">
            <p className="book-lead">Loading…</p>
          </header>
        </div>
      }
    >
      <BookContent />
    </Suspense>
  )
}
