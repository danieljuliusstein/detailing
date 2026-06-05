#!/usr/bin/env node
/**
 * Seed default supplies into PocketBase.
 * Usage: PB_URL=http://127.0.0.1:8090 PB_EMAIL=... PB_PASSWORD=... node scripts/seed-supplies.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const SUPPLIES = [
  { name: 'Car wash soap', unit: 'oz', quantity_on_hand: 128, reorder_threshold: 32, cost_per_unit: 0.15, supplier: 'Chemical Guys' },
  { name: 'Microfiber towels', unit: 'each', quantity_on_hand: 24, reorder_threshold: 8, cost_per_unit: 2.5, supplier: 'Amazon' },
  { name: 'Interior cleaner', unit: 'oz', quantity_on_hand: 64, reorder_threshold: 16, cost_per_unit: 0.22, supplier: 'Meguiars' },
  { name: 'Wax / sealant', unit: 'oz', quantity_on_hand: 32, reorder_threshold: 8, cost_per_unit: 1.2, supplier: 'Chemical Guys' },
  { name: 'Ceramic coating', unit: 'oz', quantity_on_hand: 16, reorder_threshold: 4, cost_per_unit: 8.5, supplier: 'Gtechniq' },
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

  const listRes = await fetch(`${PB_URL}/api/collections/supplies/records?perPage=1`, { headers })
  const list = await listRes.json()
  if (list.totalItems > 0) {
    console.log(`Supplies already exist (${list.totalItems} total). Skipping.`)
    return
  }

  for (const item of SUPPLIES) {
    const res = await fetch(`${PB_URL}/api/collections/supplies/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    })
    if (!res.ok) {
      console.error('Failed to create supply:', item.name, await res.text())
      process.exit(1)
    }
    console.log('Created:', item.name)
  }

  console.log('Done — 5 supplies seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
