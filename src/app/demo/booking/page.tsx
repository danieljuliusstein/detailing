'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import BookingCalendarWidget from '@/components/booking/BookingCalendarWidget'
import { loadOrganizationSlug } from '@/lib/tenant'

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function DemoBookingPage() {
  const [slug, setSlug] = useState('atlas-detailing')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const nextSunday = useMemo(() => {
    const d = new Date(today + 'T12:00:00')
    const day = d.getDay()
    const delta = day === 0 ? 0 : 7 - day
    d.setDate(d.getDate() + delta)
    return d.toISOString().slice(0, 10)
  }, [today])

  useEffect(() => {
    void loadOrganizationSlug().then((s) => {
      if (s) setSlug(s)
    })
  }, [])

  const apiBase = `/api/public/${slug}`
  const bookUrl = `/book/${slug}`

  return (
    <div className="screen page-content body">
      <header className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={() => window.history.back()} />
          <div>
            <h1 className="lg" style={{ margin: 0 }}>Booking demo</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Live preview of your public calendar
            </p>
          </div>
        </div>
      </header>

      <div className="card" style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        <p style={{ margin: '0 0 10px' }}>
          This uses your real operator settings: work days, lunch block, time off, package durations, and booked jobs.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Sundays should show no available slots (Mon–Sat schedule)</li>
          <li>12:00 lunch window blocked</li>
          <li>All-day time off on {nextSunday} if seeded</li>
          <li>Today&apos;s 10:00 Full Detail job blocks overlapping slots</li>
        </ul>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Seed demo data: <code>npm run seed:schedule-demo</code> (restart PocketBase after migrations).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href={bookUrl} className="btn-primary" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
          Open full booking page
        </Link>
        <Link
          href="/settings/schedule"
          className="btn-ghost"
          style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}
        >
          Edit schedule
        </Link>
      </div>

      <p className="sec">Calendar preview</p>
      <div className="client-light-root" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <BookingCalendarWidget slug={slug} apiBase={apiBase} linkTarget="_self" />
      </div>

      <p className="sec" style={{ marginTop: 20 }}>Test dates</p>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <div>Today: {today}</div>
        <div>Next Sunday (closed / day off): {nextSunday}</div>
        <div>Partial block sample: {addDays(today, 4)}</div>
      </div>
    </div>
  )
}
