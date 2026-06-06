'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Boat,
  Bus,
  CalendarBlank,
  Car,
  CaretLeft,
  CheckCircle,
  Circle,
  Clock,
  DotsThree,
  House,
  Jeep,
  MagnifyingGlass,
  MapPin,
  Plus,
  Truck,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import JobExpensesSheet, { type JobExpenseDraft } from '@/components/jobs/JobExpensesSheet'
import JobSuppliesConfirmSheet from '@/components/jobs/JobSuppliesConfirmSheet'
import { getSupplies } from '@/lib/api'
import './QuickAddJob.css'
import { fmt } from '@/lib/calculations'
import { deriveInitials } from '@/lib/client-relationship-logic'
import type { ClientWithStats, Package, QuickJobData, Supply, SupplyUsage, VehicleType } from '@/lib/types'

interface QuickAddJobProps {
  packages: Package[]
  clients: ClientWithStats[]
  initialClient?: ClientWithStats | null
  initialPackageId?: string
  initialDate?: string
  onSave: (data: QuickJobData) => Promise<{ id: string }>
}

const VEHICLE_TYPES: { id: VehicleType; label: string; Icon: PhosphorIcon }[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Bus },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateBox(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeDisplay(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const dt = new Date()
  dt.setHours(h, m)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function QuickAddJob({
  packages,
  clients,
  initialClient,
  initialPackageId,
  initialDate,
  onSave,
}: QuickAddJobProps) {
  const router = useRouter()

  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [showClientList, setShowClientList] = useState(false)
  const [jobDate, setJobDate] = useState(() => initialDate ?? new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    () => packages.find((p) => p.id === initialPackageId) ?? packages[0] ?? null
  )
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const initialPkg = packages.find((p) => p.id === initialPackageId) ?? packages[0]
  const [revenue, setRevenue] = useState(initialPkg?.base_price ?? 0)
  const [tip, setTip] = useState(0)
  const [notes, setNotes] = useState('')
  const [expenses, setExpenses] = useState<JobExpenseDraft>({
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
  })
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [suppliesSheetOpen, setSuppliesSheetOpen] = useState(false)
  const [catalogSupplies, setCatalogSupplies] = useState<Supply[]>([])
  const [pendingSupplies, setPendingSupplies] = useState<SupplyUsage[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (initialClient) {
      setSelectedClient(initialClient)
      setClientSearch('')
    }
  }, [initialClient])

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone?.includes(clientSearch) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const isValid =
    Boolean(selectedClient?.id) &&
    Boolean(selectedPackage?.id) &&
    Boolean(vehicleType) &&
    revenue > 0

  const handlePackageSelect = useCallback((pkg: Package) => {
    setSelectedPackage(pkg)
    setRevenue(pkg.base_price)
  }, [])

  const buildPayload = (supplies_used?: SupplyUsage[]): QuickJobData => ({
    clientId: selectedClient!.id,
    clientName: selectedClient!.name,
    packageId: selectedPackage!.id,
    vehicleType,
    locationType,
    revenue,
    tip,
    date: jobDate,
    start_time: startTime || undefined,
    notes: notes.trim() || undefined,
    travel_cost: expenses.travel_cost,
    marketing_cost: expenses.marketing_cost,
    equipment_depreciation: expenses.equipment_depreciation,
    supplies_used,
  })

  const performSave = async (supplies_used?: SupplyUsage[]) => {
    setSaving(true)
    try {
      const job = await onSave(buildPayload(supplies_used))
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save job.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaveError(null)
    if (!selectedClient) {
      setSaveError('Select a client.')
      return
    }
    if (!selectedPackage) {
      setSaveError('Select a service package.')
      return
    }
    if (revenue <= 0) {
      setSaveError('Enter revenue greater than zero.')
      return
    }
    const supplies = await getSupplies()
    setCatalogSupplies(supplies)
    setPendingSupplies(null)
    setSuppliesSheetOpen(true)
  }

  const headerDate = formatHeaderDate(new Date())

  return (
    <div className="new-job">
      <header className="new-job-header">
        <div className="new-job-header-left">
          <button type="button" className="new-job-back" onClick={() => router.back()} aria-label="Back">
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
          <h1 className="new-job-title">New job</h1>
        </div>
        <span className="new-job-header-date">{headerDate}</span>
      </header>

      <div className="new-job-body">
        {/* 1. Client */}
        <section id="nj-client" className="new-job-section">
          <div className="new-job-label">Client</div>
          {selectedClient ? (
            <button
              type="button"
              className="new-job-client-selected"
              onClick={() => {
                setSelectedClient(null)
                setClientSearch('')
                setShowClientList(true)
              }}
            >
              <span className="new-job-client-avatar new-job-client-avatar--selected">
                {deriveInitials(selectedClient.name)}
              </span>
              <span className="new-job-client-selected-text">
                <span className="new-job-client-selected-name">{selectedClient.name}</span>
                <span className="new-job-client-selected-meta">
                  {selectedClient.jobCount} job{selectedClient.jobCount !== 1 ? 's' : ''} ·{' '}
                  {fmt(selectedClient.totalRevenue)} lifetime
                </span>
              </span>
              <CheckCircle size={18} weight="fill" color="#3dc97a" className="new-job-client-check" />
            </button>
          ) : (
            <div className="new-job-client-search-wrap">
              <MagnifyingGlass size={16} className="new-job-search-icon" aria-hidden="true" />
              <input
                className="new-job-input new-job-input--search"
                placeholder="Search clients..."
                value={clientSearch}
                onFocus={() => setShowClientList(true)}
                onBlur={() => setTimeout(() => setShowClientList(false), 150)}
                onChange={(e) => setClientSearch(e.target.value)}
              />
              {showClientList && filteredClients.length > 0 && (
                <div className="new-job-client-dropdown">
                  {filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="new-job-client-option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedClient(c)
                        setClientSearch('')
                        setShowClientList(false)
                      }}
                    >
                      <span className="new-job-client-avatar">{deriveInitials(c.name)}</span>
                      <span className="new-job-client-option-text">
                        <span className="new-job-client-option-name">{c.name}</span>
                        <span className="new-job-client-option-meta">
                          {c.jobCount} job{c.jobCount !== 1 ? 's' : ''} · {fmt(c.totalRevenue)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Date & Time */}
        <section id="nj-datetime" className="new-job-section">
          <div className="new-job-label">Date &amp; Time</div>
          <div className="new-job-datetime-grid">
            <label className="new-job-datetime-box">
              <CalendarBlank size={16} color="#555" aria-hidden="true" />
              <span className="new-job-datetime-value">{formatDateBox(jobDate)}</span>
              <input
                type="date"
                className="new-job-datetime-native"
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
              />
            </label>
            <label className="new-job-datetime-box">
              <Clock size={16} color="#555" aria-hidden="true" />
              <span
                className={`new-job-datetime-value${startTime ? '' : ' new-job-datetime-value--empty'}`}
              >
                {startTime ? formatTimeDisplay(startTime) : 'Set time'}
              </span>
              <input
                type="time"
                className="new-job-datetime-native"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* 3. Service & Vehicle */}
        <section id="nj-service" className="new-job-section">
          <div className="new-job-label">Package</div>
          {packages.length === 0 ? (
            <p className="new-job-empty-hint">
              No packages yet.{' '}
              <a href="/settings/packages" className="new-job-link">
                Add one in Settings
              </a>
            </p>
          ) : (
            <div className="new-job-package-list">
              {packages.map((pkg) => {
                const selected = selectedPackage?.id === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`new-job-package-card${selected ? ' new-job-package-card--selected' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <span className="new-job-package-left">
                      <span className="new-job-package-name">{pkg.name}</span>
                      {pkg.description && (
                        <span className="new-job-package-desc">{pkg.description}</span>
                      )}
                    </span>
                    <span className="new-job-package-right">
                      <span className="new-job-package-price">{fmt(pkg.base_price)}</span>
                      {selected ? (
                        <CheckCircle size={18} weight="fill" color="#3dc97a" />
                      ) : (
                        <Circle size={18} color="#2a2a2a" />
                      )}
                    </span>
                  </button>
                )
              })}
              <button
                type="button"
                className="new-job-add-package"
                onClick={() => router.push('/settings/packages')}
              >
                <Plus size={14} color="#555" aria-hidden="true" />
                Add new package
              </button>
            </div>
          )}

          <div className="new-job-label" style={{ marginTop: 4 }}>
            Vehicle type
          </div>
          <div className="new-job-vehicle-grid">
            {VEHICLE_TYPES.map((v) => {
              const active = vehicleType === v.id
              const { Icon } = v
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`new-job-vehicle-btn${active ? ' new-job-vehicle-btn--selected' : ''}`}
                  onClick={() => setVehicleType(v.id)}
                >
                  <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>{v.label}</span>
                </button>
              )
            })}
          </div>

          <div className="new-job-label">Location</div>
          <div className="new-job-location-toggle">
            <button
              type="button"
              className={`new-job-location-opt${locationType === 'mobile' ? ' new-job-location-opt--selected' : ''}`}
              onClick={() => setLocationType('mobile')}
            >
              <MapPin size={15} aria-hidden="true" />
              Mobile
            </button>
            <button
              type="button"
              className={`new-job-location-opt${locationType === 'fixed' ? ' new-job-location-opt--selected' : ''}`}
              onClick={() => setLocationType('fixed')}
            >
              <House size={15} aria-hidden="true" />
              Fixed
            </button>
          </div>
        </section>

        {/* 4. Revenue */}
        <section id="nj-revenue" className="new-job-section">
          <div className="new-job-label">Revenue &amp; Tip</div>
          <div className="new-job-money-grid">
            <div>
              <div className="new-job-money-sublabel">Revenue</div>
              <div className="new-job-money-box">
                <span className="new-job-money-sign new-job-money-sign--green">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="new-job-money-input"
                  placeholder="0"
                  value={revenue || ''}
                  onChange={(e) => setRevenue(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <div className="new-job-money-sublabel">Tip</div>
              <div className="new-job-money-box">
                <span className="new-job-money-sign">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="new-job-money-input"
                  placeholder="0"
                  value={tip || ''}
                  onChange={(e) => setTip(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Notes */}
        <section id="nj-notes" className="new-job-section">
          <div className="new-job-label">
            Notes <span className="new-job-optional">OPTIONAL</span>
          </div>
          <div className="new-job-notes-box">
            <textarea
              className="new-job-notes-input"
              placeholder="e.g. client wants interior only, paint correction on driver side..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </section>

        {saveError && <p className="new-job-error">{saveError}</p>}
      </div>

      <div className="new-job-footer">
        <button
          type="button"
          className={`new-job-save-btn${!isValid ? ' new-job-save-btn--muted' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save job'}
        </button>
        <button
          type="button"
          className="new-job-expenses-btn"
          onClick={() => setExpenseSheetOpen(true)}
        >
          <Plus size={14} aria-hidden="true" />
          Expenses
        </button>
      </div>

      {expenseSheetOpen && (
        <JobExpensesSheet
          value={expenses}
          onSave={setExpenses}
          onClose={() => setExpenseSheetOpen(false)}
        />
      )}

      {suppliesSheetOpen && (
        <JobSuppliesConfirmSheet
          supplies={catalogSupplies}
          pkg={selectedPackage ?? undefined}
          initialUsed={pendingSupplies ?? undefined}
          onConfirm={(used) => {
            setSuppliesSheetOpen(false)
            void performSave(used)
          }}
          onClose={() => setSuppliesSheetOpen(false)}
        />
      )}
    </div>
  )
}
