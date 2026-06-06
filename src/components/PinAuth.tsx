'use client'

import { useState } from 'react'
import { Car } from '@phosphor-icons/react'
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
    } else {
      if (pin.length < 4) setPinValue((p) => p + digit)
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
  const canSubmit = needsSetup
    ? pin.length === 4 && confirmPin.length === 4
    : pin.length === 4

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg-base)',
      }}
    >
      <Car size={48} weight="duotone" color="var(--green)" aria-hidden="true" style={{ marginBottom: 16 }} />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
        {needsSetup ? 'Set your PIN' : 'Enter PIN'}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center' }}>
        {needsSetup
          ? 'Choose a 4-digit PIN to secure your business data'
          : 'Enter your PIN to open the app'}
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: activePin.length > i ? 'var(--green)' : 'var(--bg-surface)',
              border: `0.5px solid ${activePin.length > i ? 'var(--green)' : 'var(--border)'}`,
              transition: 'all 150ms ease',
            }}
          />
        ))}
      </div>

      {needsSetup && pin.length === 4 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Confirm PIN</p>
      )}

      {error && (
        <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280, marginBottom: 20 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => {
          if (key === '') return <div key={idx} />
          const isBack = key === '⌫'
          return (
            <button
              key={idx}
              onClick={() => (isBack ? handleBackspace() : handleDigit(key))}
              style={{
                height: 64,
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: isBack ? 20 : 24,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {key}
            </button>
          )
        })}
      </div>

      {canSubmit && (
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ maxWidth: 280 }}>
          {loading ? '…' : needsSetup ? 'Save PIN' : 'Unlock'}
        </button>
      )}
    </div>
  )
}
