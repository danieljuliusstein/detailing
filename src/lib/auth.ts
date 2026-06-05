const PIN_HASH_KEY = 'detailing_pin_hash'
const UNLOCKED_KEY = 'detailing_unlocked_at'
const LOCK_TIMEOUT_MS = 5 * 60 * 1000

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPin(pin: string): Promise<string> {
  return sha256(pin)
}

export function hasPinSet(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PIN_HASH_KEY)
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_HASH_KEY, hash)
  unlock()
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) return false
  const hash = await hashPin(pin)
  return hash === stored
}

export function unlock(): void {
  localStorage.setItem(UNLOCKED_KEY, Date.now().toString())
}

export function lock(): void {
  localStorage.removeItem(UNLOCKED_KEY)
}

export function isUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  if (!hasPinSet()) return true

  const unlockedAt = localStorage.getItem(UNLOCKED_KEY)
  if (!unlockedAt) return false

  const elapsed = Date.now() - Number(unlockedAt)
  if (elapsed > LOCK_TIMEOUT_MS) {
    lock()
    return false
  }
  return true
}

export function touchActivity(): void {
  if (isUnlocked()) unlock()
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  if (!(await verifyPin(currentPin))) return false
  if (!/^\d{4}$/.test(newPin)) return false
  await setPin(newPin)
  return true
}
