'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car, Jeep, Truck, Van, Boat, DotsThree, MapPin, House, FloppyDisk,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import type { JobEditData, JobStatus, JobWithRelations, Package, Supply, SupplyUsage, VehicleType } from '@/lib/types'

const VEHICLE_TYPES: { id: VehicleType; label: string; Icon: PhosphorIcon }[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Van },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

const STATUSES: { id: JobStatus; label: string; badge: string }[] = [
  { id: 'scheduled', label: 'Scheduled', badge: 'badge-scheduled' },
  { id: 'in_progress', label: 'In progress', badge: 'badge-pending' },
  { id: 'completed', label: 'Completed', badge: 'badge-draft' },
  { id: 'invoiced', label: 'Invoiced', badge: 'badge-pending' },
  { id: 'paid', label: 'Paid', badge: 'badge-paid' },
]

interface JobEditProps {
  job: JobWithRelations
  packages: Package[]
  supplies: Supply[]
  onSave: (data: JobEditData) => Promise<void>
}

export default function JobEdit({ job, packages, supplies, onSave }: JobEditProps) {
  const router = useRouter()
  const [packageId, setPackageId] = useState(job.package_id)
  const [vehicleType, setVehicleType] = useState(job.vehicle_type)
  const [locationType, setLocationType] = useState(job.location_type)
  const [revenue, setRevenue] = useState(job.revenue)
  const [tip, setTip] = useState(job.tip)
  const [hoursWorked, setHoursWorked] = useState(job.hours_worked)
  const [startTime, setStartTime] = useState(job.start_time ?? '')
  const [status, setStatus] = useState<JobStatus>(job.status)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [travelCost, setTravelCost] = useState(job.travel_cost)
  const [marketingCost, setMarketingCost] = useState(job.marketing_cost)
  const [equipmentCost, setEquipmentCost] = useState(job.equipment_depreciation)
  const [suppliesUsed, setSuppliesUsed] = useState<SupplyUsage[]>(job.supplies_used)
  const [saving, setSaving] = useState(false)

  const handlePackageSelect = useCallback((pkg: Package) => {
    setPackageId(pkg.id)
    setRevenue(pkg.base_price)
    if (pkg.default_supplies?.length) {
      setSuppliesUsed(pkg.default_supplies.map((d) => ({
        supply_id: d.supply_id,
        quantity_used: d.default_qty,
      })))
    }
  }, [])

  const updateSupplyQty = (supplyId: string, qty: number) => {
    setSuppliesUsed((prev) => {
      const existing = prev.find((u) => u.supply_id === supplyId)
      if (qty <= 0) return prev.filter((u) => u.supply_id !== supplyId)
      if (existing) return prev.map((u) => u.supply_id === supplyId ? { ...u, quantity_used: qty } : u)
      return [...prev, { supply_id: supplyId, quantity_used: qty }]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        packageId,
        vehicleType,
        locationType,
        revenue,
        tip,
        hours_worked: hoursWorked,
        start_time: startTime || undefined,
        status,
        notes: notes || undefined,
        supplies_used: suppliesUsed,
        travel_cost: travelCost,
        marketing_cost: marketingCost,
        equipment_depreciation: equipmentCost,
      })
      router.push(`/jobs/${job.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Edit job</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="section-title">Client</div>
      <div className="card" style={{ marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
        {job.client?.name ?? 'Unknown'}
      </div>

      <div className="section-title">Package</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {packages.map((pkg) => {
          const active = packageId === pkg.id
          return (
            <div key={pkg.id} onClick={() => handlePackageSelect(pkg)} style={{
              background: active ? 'var(--green)' : 'var(--bg-surface)',
              border: `0.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#071407' : 'var(--text-primary)' }}>{pkg.name}</div>
              <div style={{ fontSize: 11, color: active ? '#1a3a1a' : 'var(--text-muted)', marginTop: 3 }}>from ${pkg.base_price}</div>
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
            <div key={v.id} onClick={() => setVehicleType(v.id)} style={{
              background: active ? 'var(--green)' : 'var(--bg-surface)',
              border: `0.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
            }}>
              <Icon size={24} weight={active ? 'fill' : 'regular'} color={active ? '#071407' : 'var(--text-muted)'} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#071407' : 'var(--text-muted)', marginTop: 4 }}>{v.label}</div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Location</div>
      <div className="toggle-group" style={{ marginBottom: 20 }}>
        <div className={`toggle-option ${locationType === 'mobile' ? 'active' : ''}`} onClick={() => setLocationType('mobile')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} weight={locationType === 'mobile' ? 'fill' : 'regular'} /> Mobile
          </span>
        </div>
        <div className={`toggle-option ${locationType === 'fixed' ? 'active' : ''}`} onClick={() => setLocationType('fixed')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <House size={14} weight={locationType === 'fixed' ? 'fill' : 'regular'} /> Fixed
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div>
          <div className="section-title">Revenue</div>
          <input type="number" className="input money" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} style={{ fontWeight: 700, color: 'var(--green)' }} />
        </div>
        <div>
          <div className="section-title">Tip</div>
          <input type="number" className="input money" value={tip} onChange={(e) => setTip(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div>
          <div className="section-title">Hours worked</div>
          <input type="number" step="0.5" className="input" value={hoursWorked} onChange={(e) => setHoursWorked(Number(e.target.value))} />
        </div>
        <div>
          <div className="section-title">Start time</div>
          <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
      </div>

      <div className="section-title">Status</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <span key={s.id} className={`badge ${s.badge}`} onClick={() => setStatus(s.id)}
            style={{ cursor: 'pointer', opacity: status === s.id ? 1 : 0.45, fontSize: 11, padding: '5px 10px' }}>
            {s.label}
          </span>
        ))}
      </div>

      <div className="section-title">Job costs</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Travel</div>
          <input type="number" className="input money" value={travelCost} onChange={(e) => setTravelCost(Number(e.target.value))} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Marketing</div>
          <input type="number" className="input money" value={marketingCost} onChange={(e) => setMarketingCost(Number(e.target.value))} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Equipment</div>
          <input type="number" className="input money" value={equipmentCost} onChange={(e) => setEquipmentCost(Number(e.target.value))} />
        </div>
      </div>

      <div className="section-title">Supplies used</div>
      <div className="card" style={{ marginBottom: 20 }}>
        {supplies.map((s) => {
          const usage = suppliesUsed.find((u) => u.supply_id === s.id)
          return (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.quantity_on_hand} {s.unit} on hand</div>
              </div>
              <input
                type="number"
                min={0}
                step={s.unit === 'each' ? 1 : 0.5}
                className="input"
                style={{ width: 72, textAlign: 'center' }}
                value={usage?.quantity_used ?? ''}
                placeholder="0"
                onChange={(e) => updateSupplyQty(s.id, Number(e.target.value))}
              />
            </div>
          )
        })}
      </div>

      <div className="section-title">Notes</div>
      <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginBottom: 24, resize: 'vertical' }} />

      <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <FloppyDisk size={18} weight="bold" />
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
