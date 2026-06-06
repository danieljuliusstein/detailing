'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { createQuote } from '@/lib/api'
import type { Client, Package, VehicleType } from '@/lib/types'

const VEHICLE_TYPES: VehicleType[] = ['sedan', 'suv', 'truck', 'van', 'boat', 'other']

export default function QuoteForm({
  clients,
  packages,
}: {
  clients: Client[]
  packages: Package[]
}) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [packageId, setPackageId] = useState(packages.find((p) => p.active)?.id ?? packages[0]?.id ?? '')
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [subtotal, setSubtotal] = useState(packages.find((p) => p.id === packageId)?.base_price ?? 0)
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [busy, setBusy] = useState(false)

  const onPackageChange = (id: string) => {
    setPackageId(id)
    const pkg = packages.find((p) => p.id === id)
    if (pkg) setSubtotal(pkg.base_price)
  }

  const handleSave = async () => {
    if (!clientId || !packageId) return
    setBusy(true)
    try {
      const quote = await createQuote({
        client_id: clientId,
        package_id: packageId,
        vehicle_type: vehicleType,
        location_type: locationType,
        date,
        subtotal,
        notes: notes || undefined,
        valid_until: validUntil,
      })
      router.replace(`/quotes/${quote.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 20 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600 }}>New quote</div>
      </div>

      <div className="card" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Client</div>
          <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Package</div>
          <select className="input" value={packageId} onChange={(e) => onPackageChange(e.target.value)}>
            {packages.filter((p) => p.active).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.base_price}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Proposed date</div>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Valid until</div>
          <input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Vehicle</div>
          <select className="input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Location</div>
          <select className="input" value={locationType} onChange={(e) => setLocationType(e.target.value as 'mobile' | 'fixed')}>
            <option value="mobile">Mobile</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Amount</div>
          <input className="input" type="number" min={0} step={1} value={subtotal} onChange={(e) => setSubtotal(Number(e.target.value))} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <button type="button" className="btn-primary" style={{ width: '100%' }} disabled={busy} onClick={handleSave}>
        {busy ? 'Saving…' : 'Create quote'}
      </button>
    </div>
  )
}
