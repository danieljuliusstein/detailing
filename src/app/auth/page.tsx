'use client'

import { useEffect, useState } from 'react'
import AccountAuth from '@/components/AccountAuth'
import PinAuth from '@/components/PinAuth'
import { ensurePocketBaseAuth, isPocketBaseAuthenticated } from '@/lib/pb-auth'

export default function AuthPage() {
  const [hasAccount, setHasAccount] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    void (async () => {
      if (isPocketBaseAuthenticated()) {
        await ensurePocketBaseAuth()
      }
      setHasAccount(isPocketBaseAuthenticated())
      setChecked(true)
    })()
  }, [])

  if (!checked) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Loading…</div>
      </div>
    )
  }

  if (!hasAccount) {
    return <AccountAuth onAuthenticated={() => setHasAccount(true)} />
  }

  return <PinAuth />
}
