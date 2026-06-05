'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car,
  Jeep,
  Truck,
  Van,
  Boat,
  DotsThree,
  MagnifyingGlass,
  MapPin,
  House,
  Plus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import type { Client, Package, QuickJobData, VehicleType } from '@/lib/types'

interface QuickAddJobProps {
  packages: Package[]
  recentClients: Client[]
  onSave: (data: QuickJobData) => Promise<{ id: string }>
}

const VEHICLE_TYPES: { id: VehicleType; label: string; Icon: PhosphorIcon }[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Van },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

export default function QuickAddJob({ packages, recentClients, onSave }: QuickAddJobProps) {
  const router = useRouter()

  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientList, setShowClientList] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(packages[0] ?? null)
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const [revenue, setRevenue] = useState(selectedPackage?.base_price ?? 0)
  const [tip, setTip] = useState(0)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filteredClients = recentClients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handlePackageSelect = useCallback((pkg: Package) => {
    setSelectedPackage(pkg)
    setRevenue(pkg.base_price)
  }, [])

  const buildPayload = (): QuickJobData => ({
    clientId: selectedClient?.id ?? null,
    clientName: selectedClient?.name ?? clientSearch,
    packageId: selectedPackage!.id,
    vehicleType,
    locationType,
    revenue,
    tip,
    date: today,
  })

  const handleSave = async () => {
    if (!selectedPackage) return
    if (!selectedClient && !clientSearch.trim()) return
    setSaving(true)
    try {
      await onSave(buildPayload())
      router.push('/')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndExpenses = async () => {
    if (!selectedPackage) return
    if (!selectedClient && !clientSearch.trim()) return
    setSaving(true)
    try {
      const job = await onSave(buildPayload())
      router.push(`/jobs/${job.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>New job</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="section-title">Client</div>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Search or type new client name..."
          value={selectedClient ? selectedClient.name : clientSearch}
          onFocus={() => { setShowClientList(true); setSelectedClient(null) }}
          onBlur={() => setTimeout(() => setShowClientList(false), 150)}
          onChange={(e) => setClientSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
        <MagnifyingGlass
          size={18}
          weight="regular"
          color="var(--text-muted)"
          aria-hidden="true"
          style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}
        />

        {showClientList && filteredClients.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', marginTop: 4, overflow: 'hidden',
          }}>
            {filteredClients.slice(0, 5).map((c) => (
              <div
                key={c.id}
                style={{ padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientList(false) }}
              >
                <div style={{ fontWeight: 500 }}>{c.name}</div>
                {c.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-title">Package</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {packages.map((pkg) => {
          const active = selectedPackage?.id === pkg.id
          return (
            <div
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              style={{
                background: active ? 'var(--green)' : 'var(--bg-surface)',
                border: `0.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#071407' : 'var(--text-primary)' }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: 11, color: active ? '#1a3a1a' : 'var(--text-muted)', marginTop: 3 }}>
                from ${pkg.base_price}
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Vehicle type</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {VEHICLE_TYPES.map((v) => {
          const active = vehicleType === v.id
          const { Icon } = v
          return (
            <div
              key={v.id}
              onClick={() => setVehicleType(v.id)}
              style={{
                background: active ? 'var(--green)' : 'var(--bg-surface)',
                border: `0.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Icon
                size={24}
                weight={active ? 'fill' : 'regular'}
                color={active ? '#071407' : 'var(--text-muted)'}
                aria-hidden="true"
                style={{ margin: '0 auto' }}
              />
              <div style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#071407' : 'var(--text-muted)', marginTop: 4 }}>
                {v.label}
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Location</div>
      <div className="toggle-group" style={{ marginBottom: 20 }}>
        <div
          className={`toggle-option ${locationType === 'mobile' ? 'active' : ''}`}
          onClick={() => setLocationType('mobile')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} weight={locationType === 'mobile' ? 'fill' : 'regular'} aria-hidden="true" />
            Mobile
          </span>
        </div>
        <div
          className={`toggle-option ${locationType === 'fixed' ? 'active' : ''}`}
          onClick={() => setLocationType('fixed')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <House size={14} weight={locationType === 'fixed' ? 'fill' : 'regular'} aria-hidden="true" />
            Fixed
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <div>
          <div className="section-title">Revenue</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>$</span>
            <input
              type="number"
              className="input money"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              style={{ paddingLeft: 26, fontSize: 20, fontWeight: 700, color: 'var(--green)' }}
            />
          </div>
        </div>
        <div>
          <div className="section-title">Tip</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>$</span>
            <input
              type="number"
              className="input money"
              value={tip}
              onChange={(e) => setTip(Number(e.target.value))}
              style={{ paddingLeft: 26, fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save job'}
        </button>
        <button
          className="btn-ghost"
          onClick={handleSaveAndExpenses}
          disabled={saving}
          style={{ whiteSpace: 'nowrap', padding: '16px 20px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} weight="bold" aria-hidden="true" />
            Expenses
          </span>
        </button>
      </div>
    </div>
  )
}
