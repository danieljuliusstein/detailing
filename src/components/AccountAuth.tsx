'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLogo from '@/components/AppLogo'
import { FloatingField } from '@/components/forms'
import { Button } from '@/components/ui'
import { loginWithPassword } from '@/lib/pb-auth'
import { markTourPending } from '@/lib/product-tour'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { slugifyBusinessName } from '@/lib/tenant'

interface AccountAuthProps {
  onAuthenticated: () => void
}

export default function AccountAuth({ onAuthenticated }: AccountAuthProps) {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup')
    }
  }, [searchParams])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [businessName, email, password, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, businessName }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Signup failed')
          return
        }
      }

      const ok = await loginWithPassword(email, password)
      if (!ok) {
        setError('Invalid email or password')
        return
      }
      if (mode === 'signup') {
        markTourPending()
      }
      onAuthenticated()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const slugPreview = businessName.trim() ? slugifyBusinessName(businessName) : ''

  return (
    <div className="auth-screen">
      <div className="auth-screen__logo">
        <AppLogo size={56} priority />
      </div>
      <h1 className="auth-screen__title">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      <p className="auth-screen__subtitle">
        {mode === 'login'
          ? 'Sign in to load your jobs, clients, and business data'
          : 'Start your solo mobile detailing workspace'}
      </p>

      {mode === 'signup' ? (
        <ul className="auth-value-props">
          <li>Share your booking link</li>
          <li>Track leads in your pipeline</li>
          <li>Send invoices and get paid</li>
        </ul>
      ) : null}

      <form ref={formRef} className="auth-form page-form" onSubmit={handleSubmit}>
        {mode === 'signup' ? (
          <FloatingField id="auth-business-name" label="Business name" filled={businessName.trim().length > 0}>
            <input
              id="auth-business-name"
              type="text"
              className={`f-input${businessName.trim() ? ' hv' : ''}`}
              placeholder=" "
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              autoComplete="organization"
            />
          </FloatingField>
        ) : null}
        {mode === 'signup' && slugPreview ? (
          <p className="auth-slug-preview">
            Booking link: <strong>/book/{slugPreview}</strong>
          </p>
        ) : null}
        <FloatingField id="auth-email" label="Email" filled={email.trim().length > 0}>
          <input
            id="auth-email"
            type="email"
            className={`f-input${email.trim() ? ' hv' : ''}`}
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </FloatingField>
        <FloatingField
          id="auth-password"
          label={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
          filled={password.trim().length > 0}
        >
          <input
            id="auth-password"
            type="password"
            className={`f-input${password.trim() ? ' hv' : ''}`}
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'signup' ? 8 : 1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </FloatingField>

        {error ? <p className="auth-error">{error}</p> : null}

        <Button type="submit" loading={loading}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <button
        type="button"
        className="auth-link"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login')
          setError('')
        }}
      >
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
