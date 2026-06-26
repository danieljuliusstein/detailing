import { getPocketBase, isPocketBaseConfigured } from './pocketbase'
import { withTimeout } from './timeout'

const AUTH_FLAG_KEY = 'pb_auth_active'

export function isPocketBaseAuthenticated(): boolean {
  const pb = getPocketBase()
  if (!pb) return false
  return pb.authStore.isValid
}

/** Validate or refresh the current user session (per-tenant login). */
export async function ensurePocketBaseAuth(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false

  const pb = getPocketBase()
  if (!pb) return false

  if (pb.authStore.isValid) {
    try {
      await withTimeout(pb.collection('users').authRefresh(), 8000, 'PocketBase auth refresh')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_FLAG_KEY, '1')
      }
      return true
    } catch {
      pb.authStore.clear()
    }
  }

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_FLAG_KEY)
  }
  return false
}

export async function loginWithPassword(email: string, password: string): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  const pb = getPocketBase()
  if (!pb) return false

  try {
    await withTimeout(
      pb.collection('users').authWithPassword(email.trim(), password),
      8000,
      'PocketBase login',
    )
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_FLAG_KEY, '1')
    }
    return true
  } catch (err) {
    console.warn('[pb-auth] Login failed:', err)
    return false
  }
}

export async function authenticatePocketBase(): Promise<boolean> {
  return ensurePocketBaseAuth()
}

export function clearPocketBaseAuth(): void {
  const pb = getPocketBase()
  if (pb) {
    pb.authStore.clear()
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_FLAG_KEY)
  }
}
