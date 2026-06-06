export type LocationType = 'mobile' | 'fixed'
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'boat' | 'other'
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'paid'
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'
export type PhotoType = 'before' | 'after'
export type OverheadCategory = 'vehicle' | 'insurance' | 'equipment' | 'software' | 'marketing' | 'other'
export type BillingCycle = 'monthly' | 'annual' | 'one_time'

export interface ExpenseLine {
  category: 'supplies' | 'travel' | 'equipment' | 'marketing' | 'labor' | 'other'
  description: string
  amount: number
}

export interface SupplyUsage {
  supply_id: string
  quantity_used: number
}

export interface Payment {
  amount: number
  method: string
  date: string
  note?: string
}

export interface Package {
  id: string
  name: string
  base_price: number
  description?: string
  default_supplies?: { supply_id: string; default_qty: number }[]
  active: boolean
}

export type SupplyKind = 'chemical' | 'consumable' | 'other'
export type EquipmentStatus = 'active' | 'retired'

export interface Supply {
  id: string
  name: string
  unit: string
  quantity_on_hand: number
  reorder_threshold?: number
  cost_per_unit?: number
  supplier?: string
  kind?: SupplyKind
  notes?: string
}

export interface Equipment {
  id: string
  name: string
  purchase_price?: number
  purchase_date?: string
  supplier?: string
  notes?: string
  status?: EquipmentStatus
}

export interface OverheadExpense {
  id: string
  name: string
  amount: number
  category?: OverheadCategory
  billing_cycle?: BillingCycle
  next_due?: string
  notes?: string
}

export interface PhotoMeta {
  filename: string
  type: PhotoType
}

export interface JobPhoto {
  filename: string
  url: string
  type: PhotoType
}

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  lead_source?: string
  tags?: string[]
  notes?: string
  created?: string
}

export interface Job {
  id: string
  date: string
  start_time?: string
  hours_worked: number
  location_type: LocationType
  package_id: string
  vehicle_type: VehicleType
  client_id: string
  status: JobStatus
  revenue: number
  tip: number
  expenses: ExpenseLine[]
  supplies_used: SupplyUsage[]
  travel_cost: number
  marketing_cost: number
  equipment_depreciation: number
  notes?: string
  photo_count: number
  photo_meta?: PhotoMeta[]
  invoice_id?: string
  created?: string
  updated?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  job_id: string
  client_id: string
  subtotal: number
  tip: number
  total: number
  status: InvoiceStatus
  payments: Payment[]
  amount_paid: number
  balance_due: number
  sent_at?: string
  paid_at?: string
  terms?: string
  notes?: string
}

export interface JobWithRelations extends Job {
  client?: Client
  package?: Package
  invoice?: Invoice
}

export interface QuickJobData {
  clientId: string | null
  clientName: string
  packageId: string
  vehicleType: VehicleType
  locationType: LocationType
  revenue: number
  tip: number
  date: string
  supplies_used?: SupplyUsage[]
}

export interface DashboardKpis {
  revenueMtd: number
  profitMtd: number
  outstanding: number
  jobsThisWeek: number
}

export interface RecentJobRow {
  id: string
  clientName: string
  package: string
  vehicleType: string
  locationType: LocationType
  revenue: number
  profit: number
  status: 'paid' | 'invoiced' | 'scheduled' | 'completed' | 'overdue'
  scheduledDate?: string
}

export interface JobEditData {
  packageId: string
  vehicleType: VehicleType
  locationType: LocationType
  revenue: number
  tip: number
  hours_worked: number
  start_time?: string
  status: JobStatus
  notes?: string
  supplies_used?: SupplyUsage[]
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
}

export interface SupplyInput {
  name: string
  unit: string
  quantity_on_hand: number
  reorder_threshold?: number
  cost_per_unit?: number
  supplier?: string
  kind?: SupplyKind
  notes?: string
}

export interface RestockInput {
  quantity: number
  total_cost?: number
}

export interface EquipmentInput {
  name: string
  purchase_price?: number
  purchase_date?: string
  supplier?: string
  notes?: string
  status?: EquipmentStatus
}

export interface OverheadInput {
  name: string
  amount: number
  category?: OverheadCategory
  billing_cycle?: BillingCycle
  next_due?: string
  notes?: string
}

export interface ClientInput {
  name: string
  phone?: string
  email?: string
  address?: string
  lead_source?: string
  tags?: string[]
  notes?: string
}

export interface PackageInput {
  name: string
  base_price: number
  description?: string
  default_supplies?: { supply_id: string; default_qty: number }[]
  active?: boolean
}

export interface ClientWithStats extends Client {
  totalRevenue: number
  jobCount: number
}

export interface WeekDay {
  date: string
  label: string
  dayNum: number
  isToday: boolean
  jobCount: number
}
