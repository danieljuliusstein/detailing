'use client'

import { useState } from 'react'
import AppLogo from '@/components/AppLogo'
import { useAuth } from '@/providers/AuthProvider'

export default function PinAuth() {
  const { needsSetup, setupPin, login } = useAuth()
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDigit = (digit: string) => {
    setError('')
    if (needsSetup) {
      if (pin.length < 4) setPinValue((p) => p + digit)
      else if (confirmPin.length < 4) setConfirmPin((p) => p + digit)
    } else if (pin.length < 4) {
      setPinValue((p) => p + digit)
    }
  }

  const handleBackspace = () => {
    setError('')
    if (needsSetup && confirmPin.length > 0) setConfirmPin((p) => p.slice(0, -1))
    else setPinValue((p) => p.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (needsSetup) {
      if (pin.length !== 4 || confirmPin.length !== 4) return
      if (pin !== confirmPin) {
        setError('PINs do not match')
        setConfirmPin('')
        return
      }
      setLoading(true)
      try {
        await setupPin(pin)
      } finally {
        setLoading(false)
      }
      return
    }

    if (pin.length !== 4) return
    setLoading(true)
    try {
      const ok = await login(pin)
      if (!ok) {
        setError('Incorrect PIN')
        setPinValue('')
      }
    } finally {
      setLoading(false)
    }
  }

  const activePin = needsSetup && pin.length === 4 ? confirmPin : pin
  const canSubmit = needsSetup ? pin.length === 4 && confirmPin.length === 4 : pin.length === 4

  return (
    <div className="auth-screen">
      <div className="auth-screen__logo">
        <AppLogo size={56} priority />
      </div>
      <h1 className="auth-screen__title">{needsSetup ? 'Set your PIN' : 'Unlock with PIN'}</h1>
      <p className="auth-screen__subtitle">
        {needsSetup
          ? 'Choose a 4-digit PIN to secure your business data'
          : 'Enter your PIN to open the app'}
      </p>

      <div className="pin-dots" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pin-dot${activePin.length > i ? ' filled' : ''}`} />
        ))}
      </div>

      {needsSetup && pin.length === 4 ? (
        <p className="auth-screen__subtitle" style={{ marginBottom: 16, marginTop: -8 }}>
          Confirm PIN
        </p>
      ) : null}

      {error ? <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p> : null}

      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => {
          if (key === '') return <div key={idx} />
          const isBack = key === '⌫'
          return (
            <button
              key={idx}
              type="button"
              className={`pin-key${isBack ? ' pin-key--back' : ''}`}
              onClick={() => (isBack ? handleBackspace() : handleDigit(key))}
              aria-label={isBack ? 'Delete' : key}
            >
              {key}
            </button>
          )
        })}
      </div>

      {canSubmit ? (
        <button type="button" className="btn-primary" onClick={() => void handleSubmit()} disabled={loading} style={{ maxWidth: 280, width: '100%' }}>
          {loading ? '…' : needsSetup ? 'Save PIN' : 'Unlock'}
        </button>
      ) : null}
    </div>
  )
}
