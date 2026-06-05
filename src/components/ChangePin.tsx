'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { changePin } from '@/lib/auth'

type Step = 'current' | 'new' | 'confirm'

export default function ChangePin() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('current')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const stepPin = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin

  const handleDigit = (digit: string) => {
    setError('')
    if (stepPin.length >= 4) return
    const next = stepPin + digit
    if (step === 'current') setCurrentPin(next)
    else if (step === 'new') setNewPin(next)
    else setConfirmPin(next)
    if (next.length === 4) {
      if (step === 'current') setTimeout(() => setStep('new'), 200)
      else if (step === 'new') setTimeout(() => setStep('confirm'), 200)
    }
  }

  const handleBackspace = () => {
    setError('')
    if (step === 'current') setCurrentPin((p) => p.slice(0, -1))
    else if (step === 'new') setNewPin((p) => p.slice(0, -1))
    else setConfirmPin((p) => p.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (newPin !== confirmPin) {
      setError('PINs do not match')
      setConfirmPin('')
      setStep('new')
      setNewPin('')
      return
    }

    setLoading(true)
    try {
      const ok = await changePin(currentPin, newPin)
      if (!ok) {
        setError('Current PIN is incorrect')
        setCurrentPin('')
        setNewPin('')
        setConfirmPin('')
        setStep('current')
        return
      }
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const labels: Record<Step, string> = {
    current: 'Enter current PIN',
    new: 'Enter new PIN',
    confirm: 'Confirm new PIN',
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600 }}>Change PIN</div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{labels[step]}</p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: stepPin.length > i ? 'var(--green)' : 'var(--bg-surface)',
                border: `0.5px solid ${stepPin.length > i ? 'var(--green)' : 'var(--border)'}`,
              }}
            />
          ))}
        </div>

        {error && <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, margin: '0 auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => {
            if (key === '') return <div key={idx} />
            const isBack = key === '⌫'
            return (
              <button
                key={idx}
                onClick={() => (isBack ? handleBackspace() : handleDigit(key))}
                style={{
                  height: 56,
                  background: 'var(--bg-surface-hover)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: isBack ? 18 : 22,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {key}
              </button>
            )
          })}
        </div>

        {step === 'confirm' && confirmPin.length === 4 && (
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 20, width: '100%', maxWidth: 280 }}>
            {loading ? '…' : 'Save new PIN'}
          </button>
        )}
      </div>
    </div>
  )
}
