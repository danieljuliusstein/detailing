import PocketBase from 'pocketbase'

let pb: PocketBase | null = null

export function getPocketBase(): PocketBase | null {
  const url = process.env.NEXT_PUBLIC_PB_URL
  if (!url) return null

  if (!pb) {
    pb = new PocketBase(url)
    pb.autoCancellation(false)
  }
  return pb
}

export function isPocketBaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PB_URL
}

export async function checkPocketBaseHealth(timeoutMs = 4000): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_PB_URL
  if (!url) return false

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${url}/api/health`, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}
