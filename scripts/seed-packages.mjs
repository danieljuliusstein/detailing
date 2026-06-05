#!/usr/bin/env node
/**
 * Seed default packages into PocketBase.
 * Usage: PB_URL=http://127.0.0.1:8090 PB_EMAIL=... PB_PASSWORD=... node scripts/seed-packages.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const PACKAGES = [
  { name: 'Basic Wash', base_price: 80, active: true, description: 'Exterior wash and dry' },
  { name: 'Full Detail', base_price: 320, active: true, description: 'Interior + exterior full detail' },
  { name: 'Paint Correct', base_price: 450, active: true, description: 'Single-stage paint correction' },
  { name: 'Ceramic Coat', base_price: 800, active: true, description: 'Ceramic coating application' },
]

async function main() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD (or NEXT_PUBLIC_PB_* env vars)')
    process.exit(1)
  }

  const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  })

  if (!authRes.ok) {
    console.error('Auth failed:', await authRes.text())
    process.exit(1)
  }

  const { token } = await authRes.json()
  const headers = { Authorization: token, 'Content-Type': 'application/json' }

  const listRes = await fetch(`${PB_URL}/api/collections/packages/records?perPage=1`, { headers })
  const list = await listRes.json()
  if (list.totalItems > 0) {
    console.log(`Packages already exist (${list.totalItems} total). Skipping.`)
    return
  }

  for (const pkg of PACKAGES) {
    const res = await fetch(`${PB_URL}/api/collections/packages/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pkg),
    })
    if (!res.ok) {
      console.error('Failed to create package:', pkg.name, await res.text())
      process.exit(1)
    }
    console.log('Created:', pkg.name)
  }

  console.log('Done — 4 packages seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
