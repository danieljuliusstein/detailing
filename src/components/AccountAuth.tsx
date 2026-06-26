'use client'

import { useState } from 'react'
import AppLogo from '@/components/AppLogo'
import { loginWithPassword } from '@/lib/pb-auth'

interface AccountAuthProps {
  onAuthenticated: () => void
}

export default function AccountAuth({ onAuthenticated }: AccountAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      onAuthenticated()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__logo">
        <AppLogo size={56} priority />
      </div>
      <h1 className="auth-screen__title">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      <p className="auth-screen__subtitle">
        {mode === 'login'
          ? 'Sign in to your detailing business'
          : 'Start your solo mobile detailing workspace'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <label className="auth-field-label" htmlFor="auth-business-name">
              Business name
            </label>
            <input
              id="auth-business-name"
              type="text"
              className="auth-input"
              placeholder="Atlas Detailing"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              autoComplete="organization"
            />
          </>
        )}
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === 'signup' ? 8 : 1}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
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
