import type {
  BusinessExpense,
  BusinessExpenseCategory,
  BusinessExpenseInput,
  Client,
  Equipment,
  ExpenseLine,
  Invoice,
  Job,
  JobWithRelations,
  OverheadExpense,
  Package,
  PhotoMeta,
  Quote,
  QuoteWithRelations,
  Supply,
  SupplyKind,
  SupplyUsage,
} from '../types'

/** PocketBase record shape (partial — expand fields vary) */
export interface PbRecord {
  id: string
  created?: string
  updated?: string
  expand?: Record<string, PbRecord | undefined>
  collectionId?: string
  collectionName?: string
  [key: string]: unknown
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function jsonArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function relationId(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'id' in v) return String((v as PbRecord).id)
  return ''
}

export function pbPackageToApp(r: PbRecord): Package {
  const returnDays = num(r.expected_return_days)
  return {
    id: r.id,
    name: String(r.name ?? ''),
    base_price: num(r.base_price),
    description: str(r.description),
    expected_return_days: returnDays > 0 ? returnDays : 90,
    default_supplies: jsonArray(r.default_supplies),
    active: bool(r.active, true),
  }
}

export function pbClientToApp(r: PbRecord): Client {
  return {
    id: r.id,
    name: String(r.name ?? ''),
    phone: str(r.phone),
    email: str(r.email),
    address: str(r.address),
    lead_source: str(r.lead_source),
    tags: jsonArray<string>(r.tags),
    notes: str(r.notes),
    created: r.created,
  }
}

export function pbQuoteToApp(r: PbRecord): Quote {
  return {
    id: r.id,
    quote_number: String(r.quote_number ?? ''),
    client_id: relationId(r.client_id),
    package_id: relationId(r.package_id),
    vehicle_type: (r.vehicle_type as Quote['vehicle_type']) ?? 'sedan',
    location_type: (r.location_type as Quote['location_type']) ?? 'mobile',
    date: String(r.date ?? ''),
    subtotal: num(r.subtotal),
    notes: str(r.notes),
    status: (r.status as Quote['status']) ?? 'draft',
    valid_until: str(r.valid_until),
    job_id: str(relationId(r.job_id)) || undefined,
    sent_at: str(r.sent_at),
    created: r.created,
  }
}

export function pbQuoteToAppWithRelations(r: PbRecord): QuoteWithRelations {
  const expand = r.expand ?? {}
  const quote = pbQuoteToApp(r)
  return {
    ...quote,
    client: expand.client_id ? pbClientToApp(expand.client_id) : undefined,
    package: expand.package_id ? pbPackageToApp(expand.package_id) : undefined,
  }
}

export function pbInvoiceToApp(r: PbRecord): Invoice {
  return {
    id: r.id,
    invoice_number: String(r.invoice_number ?? ''),
    job_id: relationId(r.job_id),
    client_id: relationId(r.client_id),
    subtotal: num(r.subtotal),
    tip: num(r.tip),
    total: num(r.total),
    status: (r.status as Invoice['status']) ?? 'draft',
    payments: jsonArray(r.payments),
    amount_paid: num(r.amount_paid),
    balance_due: num(r.balance_due),
    sent_at: str(r.sent_at),
    paid_at: str(r.paid_at),
    terms: str(r.terms),
    notes: str(r.notes),
  }
}

export function pbJobToApp(r: PbRecord): Job {
  const photos = r.photos
  const photoCount = Array.isArray(photos) ? photos.length : 0

  return {
    id: r.id,
    date: String(r.date ?? '').slice(0, 10),
    start_time: str(r.start_time),
    hours_worked: num(r.hours_worked),
    location_type: (r.location_type as Job['location_type']) ?? 'mobile',
    package_id: relationId(r.package_id),
    vehicle_type: (r.vehicle_type as Job['vehicle_type']) ?? 'sedan',
    client_id: relationId(r.client_id),
    status: (r.status as Job['status']) ?? 'completed',
    revenue: num(r.revenue),
    tip: num(r.tip),
    expenses: jsonArray<ExpenseLine>(r.expenses),
    supplies_used: jsonArray<SupplyUsage>(r.supplies_used),
    travel_cost: num(r.travel_cost),
    marketing_cost: num(r.marketing_cost),
    equipment_depreciation: num(r.equipment_depreciation),
    notes: str(r.notes),
    photo_count: photoCount,
    photo_meta: jsonArray<PhotoMeta>(r.photo_meta),
    invoice_id: relationId(r.invoice_id) || undefined,
    created: r.created,
    updated: r.updated,
  }
}

export function pbJobToAppWithRelations(r: PbRecord): JobWithRelations {
  const job = pbJobToApp(r)
  const expand = r.expand ?? {}

  return {
    ...job,
    client: expand.client_id ? pbClientToApp(expand.client_id) : undefined,
    package: expand.package_id ? pbPackageToApp(expand.package_id) : undefined,
    invoice: expand.invoice_id ? pbInvoiceToApp(expand.invoice_id) : undefined,
  }
}

export function appJobCreateToPb(input: {
  date: string
  location_type: string
  package_id: string
  vehicle_type: string
  client_id: string
  status: string
  revenue: number
  tip: number
  start_time?: string
  notes?: string
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
}) {
  return {
    date: input.date,
    location_type: input.location_type,
    package_id: input.package_id,
    vehicle_type: input.vehicle_type,
    client_id: input.client_id,
    status: input.status,
    revenue: input.revenue,
    tip: input.tip,
    start_time: input.start_time ?? '',
    notes: input.notes ?? '',
    hours_worked: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: input.travel_cost ?? 0,
    marketing_cost: input.marketing_cost ?? 0,
    equipment_depreciation: input.equipment_depreciation ?? 0,
  }
}

export function appJobEditToPb(updates: {
  date?: string
  packageId: string
  vehicleType: string
  locationType: string
  revenue: number
  tip: number
  hours_worked: number
  start_time?: string
  status: string
  notes?: string
  supplies_used?: SupplyUsage[]
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
  expenses?: ExpenseLine[]
}) {
  const payload: Record<string, unknown> = {
    ...(updates.date !== undefined ? { date: updates.date } : {}),
    package_id: updates.packageId,
    vehicle_type: updates.vehicleType,
    location_type: updates.locationType,
    revenue: updates.revenue,
    tip: updates.tip,
    hours_worked: updates.hours_worked,
    start_time: updates.start_time ?? '',
    status: updates.status,
    notes: updates.notes ?? '',
  }
  if (updates.supplies_used !== undefined) payload.supplies_used = updates.supplies_used
  if (updates.travel_cost !== undefined) payload.travel_cost = updates.travel_cost
  if (updates.marketing_cost !== undefined) payload.marketing_cost = updates.marketing_cost
  if (updates.equipment_depreciation !== undefined) {
    payload.equipment_depreciation = updates.equipment_depreciation
  }
  if (updates.expenses !== undefined) payload.expenses = updates.expenses
  return payload
}

export function pbSupplyToApp(r: PbRecord): Supply {
  const kind = str(r.kind) as SupplyKind | undefined
  return {
    id: r.id,
    name: String(r.name ?? ''),
    unit: String(r.unit ?? ''),
    quantity_on_hand: num(r.quantity_on_hand),
    reorder_threshold: typeof r.reorder_threshold === 'number' ? r.reorder_threshold : undefined,
    cost_per_unit: typeof r.cost_per_unit === 'number' ? r.cost_per_unit : undefined,
    supplier: str(r.supplier),
    kind: kind && ['chemical', 'consumable', 'other'].includes(kind) ? kind : 'other',
    notes: str(r.notes),
  }
}

export function appSupplyToPb(input: {
  name: string
  unit: string
  quantity_on_hand: number
  reorder_threshold?: number
  cost_per_unit?: number
  supplier?: string
  kind?: SupplyKind
  notes?: string
}) {
  return {
    name: input.name,
    unit: input.unit,
    quantity_on_hand: input.quantity_on_hand,
    reorder_threshold: input.reorder_threshold ?? 0,
    cost_per_unit: input.cost_per_unit ?? 0,
    supplier: input.supplier ?? '',
    kind: input.kind ?? 'other',
    notes: input.notes ?? '',
  }
}

export function pbEquipmentToApp(r: PbRecord): Equipment {
  return {
    id: r.id,
    name: String(r.name ?? ''),
    purchase_price: typeof r.purchase_price === 'number' ? r.purchase_price : undefined,
    purchase_date: str(r.purchase_date)?.slice(0, 10),
    supplier: str(r.supplier),
    notes: str(r.notes),
    status: (str(r.status) as Equipment['status']) ?? 'active',
  }
}

export function appEquipmentToPb(input: {
  name: string
  purchase_price?: number
  purchase_date?: string
  supplier?: string
  notes?: string
  status?: Equipment['status']
}) {
  return {
    name: input.name,
    purchase_price: input.purchase_price ?? 0,
    purchase_date: input.purchase_date ?? '',
    supplier: input.supplier ?? '',
    notes: input.notes ?? '',
    status: input.status ?? 'active',
  }
}

export function pbBusinessExpenseToApp(r: PbRecord): BusinessExpense {
  const category = str(r.category) as BusinessExpenseCategory | undefined
  const valid: BusinessExpenseCategory[] = [
    'legal', 'licensing', 'taxes', 'insurance', 'vehicle', 'marketing', 'software', 'equipment', 'supplies', 'other',
  ]
  const supplyId = r.supply_id
  return {
    id: r.id,
    date: String(r.date ?? '').slice(0, 10),
    name: String(r.name ?? ''),
    amount: num(r.amount),
    category: category && valid.includes(category) ? category : 'other',
    vendor: str(r.vendor),
    notes: str(r.notes),
    supply_id: typeof supplyId === 'string' && supplyId ? supplyId : undefined,
    quantity: typeof r.quantity === 'number' ? r.quantity : undefined,
    snapshot_qty_on_hand: typeof r.snapshot_qty_on_hand === 'number' ? r.snapshot_qty_on_hand : undefined,
    snapshot_cost_per_unit: typeof r.snapshot_cost_per_unit === 'number' ? r.snapshot_cost_per_unit : undefined,
  }
}

export function appBusinessExpenseToPb(input: BusinessExpenseInput) {
  return {
    date: input.date,
    name: input.name,
    amount: input.amount,
    category: input.category ?? 'other',
    vendor: input.vendor ?? '',
    notes: input.notes ?? '',
    supply_id: input.supply_id ?? '',
    quantity: input.quantity ?? 0,
    snapshot_qty_on_hand: input.snapshot_qty_on_hand ?? 0,
    snapshot_cost_per_unit: input.snapshot_cost_per_unit ?? 0,
  }
}

export function pbOverheadToApp(r: PbRecord): OverheadExpense {
  return {
    id: r.id,
    name: String(r.name ?? ''),
    amount: num(r.amount),
    category: str(r.category) as OverheadExpense['category'],
    billing_cycle: str(r.billing_cycle) as OverheadExpense['billing_cycle'],
    next_due: str(r.next_due)?.slice(0, 10),
    notes: str(r.notes),
  }
}

export function appOverheadToPb(input: {
  name: string
  amount: number
  category?: string
  billing_cycle?: string
  next_due?: string
  notes?: string
}) {
  return {
    name: input.name,
    amount: input.amount,
    category: input.category ?? 'other',
    billing_cycle: input.billing_cycle ?? 'monthly',
    next_due: input.next_due ?? '',
    notes: input.notes ?? '',
  }
}

export function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
