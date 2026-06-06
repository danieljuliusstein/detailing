import { getPocketBase, isPocketBaseConfigured } from './pocketbase'
import { withTimeout } from './timeout'

const AUTH_FLAG_KEY = 'pb_auth_active'

export function isPocketBaseAuthenticated(): boolean {
  const pb = getPocketBase()
  if (!pb) return false
  return pb.authStore.isValid
}

async function authWithCredentials(pb: NonNullable<ReturnType<typeof getPocketBase>>): Promise<boolean> {
  const email = process.env.NEXT_PUBLIC_PB_EMAIL
  const password = process.env.NEXT_PUBLIC_PB_PASSWORD

  if (!email || !password) {
    console.warn('[pb-auth] NEXT_PUBLIC_PB_EMAIL or NEXT_PUBLIC_PB_PASSWORD not set')
    return false
  }

  try {
    await withTimeout(
      pb.collection('users').authWithPassword(email, password),
      8000,
      'PocketBase auth',
    )
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_FLAG_KEY, '1')
    }
    return true
  } catch (err) {
    console.warn('[pb-auth] Authentication failed:', err)
    return false
  }
}

/** Validate or refresh auth — unauthenticated list calls return empty 200, not errors. */
export async function ensurePocketBaseAuth(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false

  const pb = getPocketBase()
  if (!pb) return false

  if (pb.authStore.isValid) {
    try {
      await withTimeout(pb.collection('users').authRefresh(), 8000, 'PocketBase auth refresh')
      return true
    } catch {
      pb.authStore.clear()
    }
  }

  return authWithCredentials(pb)
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
