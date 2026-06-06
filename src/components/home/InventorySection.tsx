'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  Flask,
  Package,
  PencilSimple,
  Star,
  Warehouse,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import EquipmentEditSheet, { type EquipmentSheetMode } from './EquipmentEditSheet'
import InventoryEditSheet from './InventoryEditSheet'
import SupplyEditSheet, { type SupplySheetMode } from './SupplyEditSheet'
import {
  createEquipment,
  createSupply,
  deleteEquipment,
  deleteSupply,
  getEquipment,
  getSupplies,
  restockSupply,
  updateEquipment,
  updateSupply,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import {
  deleteHomeInventoryItem,
  getItemsByCategory,
  loadHomeInventory,
  saveHomeInventory,
  upsertHomeInventoryItem,
  type HomeInventoryItem,
  type InventoryStatus,
} from '@/lib/home-inventory'
import { filterSuppliesByKind, isLowStock } from '@/lib/supplies-logic'
import type { Equipment, Supply, SupplyKind } from '@/lib/types'

type SectionKey = 'chemicals' | 'equipment' | 'supplies' | 'wishlist'

type OpenSections = Record<SectionKey, boolean>

const SECTIONS: {
  key: SectionKey
  title: string
  Icon: PhosphorIcon
  iconBg: string
  iconColor: string
  addLabel: string
  supplyKind?: SupplyKind
  isWishlist?: boolean
  isEquipment?: boolean
}[] = [
  {
    key: 'chemicals',
    title: 'Chemicals',
    Icon: Flask,
    iconBg: 'var(--green-dim)',
    iconColor: 'var(--green-text)',
    addLabel: 'chemical',
    supplyKind: 'chemical',
  },
  {
    key: 'equipment',
    title: 'Equipment',
    Icon: Wrench,
    iconBg: 'var(--blue-dim)',
    iconColor: 'var(--blue-text)',
    addLabel: 'equipment',
    isEquipment: true,
  },
  {
    key: 'supplies',
    title: 'Supplies',
    Icon: Package,
    iconBg: 'var(--amber-dim)',
    iconColor: 'var(--amber-text)',
    addLabel: 'supply',
    supplyKind: 'consumable',
  },
  {
    key: 'wishlist',
    title: 'Wish List',
    Icon: Star,
    iconBg: 'var(--red-dim)',
    iconColor: 'var(--amber-text)',
    addLabel: 'item',
    isWishlist: true,
  },
]

function notifyLowStock(name: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(`You're running low on ${name} — time to restock`)
  } catch {
    // ignore
  }
}

function SupplyRow({
  supply,
  onEdit,
  showDivider,
}: {
  supply: Supply
  onEdit: () => void
  showDivider: boolean
}) {
  const low = isLowStock(supply)
  return (
    <div className={`inv-item-row-wrap${showDivider ? ' inv-item-row-wrap--divider' : ''}`}>
      <button type="button" className="inv-item-row" onClick={onEdit}>
        <span className="inv-item-name">{supply.name}</span>
        <div className="inv-item-row-right">
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 6 }}>
            {supply.quantity_on_hand} {supply.unit}
          </span>
          <span className={`inv-status-badge inv-status-badge--${low ? 'low' : 'ok'}`}>
            {low ? 'LOW' : 'OK'}
          </span>
          <span className="inv-item-edit" aria-hidden>
            <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
          </span>
        </div>
      </button>
    </div>
  )
}

function EquipmentRow({
  item,
  onEdit,
  showDivider,
}: {
  item: Equipment
  onEdit: () => void
  showDivider: boolean
}) {
  return (
    <div className={`inv-item-row-wrap${showDivider ? ' inv-item-row-wrap--divider' : ''}`}>
      <button type="button" className="inv-item-row" onClick={onEdit}>
        <span className="inv-item-name">{item.name}</span>
        <div className="inv-item-row-right">
          {item.purchase_price != null && item.purchase_price > 0 && (
            <span className="inv-item-price">{fmtDetailed(item.purchase_price)}</span>
          )}
          {item.status === 'retired' && (
            <span className="inv-status-badge inv-status-badge--low">RETIRED</span>
          )}
          <span className="inv-item-edit" aria-hidden>
            <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
          </span>
        </div>
      </button>
    </div>
  )
}

function WishlistRow({
  item,
  onEdit,
  showDivider,
}: {
  item: HomeInventoryItem
  onEdit: () => void
  showDivider: boolean
}) {
  return (
    <div className={`inv-item-row-wrap${showDivider ? ' inv-item-row-wrap--divider' : ''}`}>
      <button type="button" className="inv-item-row" onClick={onEdit}>
        <span className="inv-item-name">{item.name}</span>
        <div className="inv-item-row-right">
          <span className="inv-item-price">${item.priceEstimate ?? 0}</span>
          <span className="inv-item-edit" aria-hidden>
            <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
          </span>
        </div>
      </button>
    </div>
  )
}

export default function InventorySection() {
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [wishlist, setWishlist] = useState<HomeInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [inventoryOpen, setInventoryOpen] = useState(true)
  const [openSections, setOpenSections] = useState<OpenSections>({
    chemicals: true,
    equipment: true,
    supplies: true,
    wishlist: true,
  })

  const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
  const [supplyKind, setSupplyKind] = useState<SupplyKind>('chemical')
  const [supplyMode, setSupplyMode] = useState<SupplySheetMode>('add')
  const [addingSupplyKind, setAddingSupplyKind] = useState<SupplyKind | null>(null)

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [equipmentMode, setEquipmentMode] = useState<EquipmentSheetMode>('add')
  const [addingEquipment, setAddingEquipment] = useState(false)

  const [editingWishlist, setEditingWishlist] = useState<HomeInventoryItem | null>(null)
  const [addingWishlist, setAddingWishlist] = useState(false)

  const reload = useCallback(async () => {
    const [supplies, equip] = await Promise.all([getSupplies(), getEquipment()])
    setCatalog(supplies)
    setEquipment(equip.filter((e) => (e.status ?? 'active') !== 'retired'))
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    setLoading(false)
  }, [])

  useEffect(() => {
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    reload()
  }, [reload])

  const lowCount = useMemo(() => catalog.filter(isLowStock).length, [catalog])
  const totalItems = catalog.length + equipment.length + wishlist.length

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => {
    setInventoryOpen(true)
    setOpenSections({ chemicals: true, equipment: true, supplies: true, wishlist: true })
  }

  const openSupplyEdit = (supply: Supply, kind: SupplyKind) => {
    setAddingSupplyKind(null)
    setEditingSupply(supply)
    setSupplyKind(kind)
    setSupplyMode('edit')
  }

  const openSupplyAdd = (kind: SupplyKind) => {
    setEditingSupply(null)
    setAddingSupplyKind(kind)
    setSupplyKind(kind)
    setSupplyMode('add')
  }

  const handleWishlistSave = (data: {
    name: string
    notes: string
    priceEstimate?: number
  }) => {
    const items = loadHomeInventory()
    const next = upsertHomeInventoryItem(items, {
      id: editingWishlist?.id,
      name: data.name,
      category: 'wishlist',
      notes: data.notes,
      priceEstimate: data.priceEstimate,
    })
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
    setAddingWishlist(false)
  }

  const handleWishlistDelete = (id: string) => {
    const next = deleteHomeInventoryItem(loadHomeInventory(), id)
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
  }

  const supplySheetOpen = Boolean(editingSupply || addingSupplyKind)
  const equipmentSheetOpen = Boolean(editingEquipment || addingEquipment)
  const wishlistSheetOpen = Boolean(editingWishlist || addingWishlist)

  return (
    <section className="inv-section">
      <div className="inv-section-label">INVENTORY</div>

      <div className="inv-dropdown-card inv-dropdown-card--outer">
        <button
          type="button"
          className="inv-dropdown-header"
          onClick={() => setInventoryOpen((o) => !o)}
        >
          <div className="inv-dropdown-header-left">
            <span className="inv-dropdown-icon" style={{ background: 'var(--bg-surface-hover)' }}>
              <Warehouse size={18} weight="duotone" color="var(--green-text)" />
            </span>
            <div>
              <div className="inv-dropdown-title">Inventory</div>
              <div className="inv-dropdown-subtitle">
                {loading ? 'Loading…' : `${totalItems} item${totalItems === 1 ? '' : 's'}`}
                {lowCount > 0 ? ` · ${lowCount} low` : ''}
              </div>
            </div>
          </div>
          <span className={`inv-chevron${inventoryOpen ? ' inv-chevron--open' : ''}`}>
            <CaretDown size={12} weight="bold" color="var(--text-dim)" />
          </span>
        </button>

        {inventoryOpen && (
          <div className="inv-dropdown-body inv-dropdown-body--outer">
            {lowCount > 0 && (
              <button type="button" className="inv-alert-banner inv-alert-banner--nested" onClick={expandAll}>
                <span className="inv-alert-dot" />
                <span className="inv-alert-text">
                  <strong>{lowCount}</strong> item{lowCount === 1 ? '' : 's'} are running low — tap to restock
                </span>
              </button>
            )}

            {SECTIONS.map((section) => {
              const isOpen = openSections[section.key]
              const { Icon } = section

              const sectionItems = section.isWishlist
                ? wishlist
                : section.isEquipment
                  ? equipment
                  : filterSuppliesByKind(catalog, section.supplyKind!)

              const low = section.supplyKind
                ? sectionItems.filter((s) => isLowStock(s as Supply)).length
                : 0

              const subtitle = section.isWishlist
                ? `$${wishlist.reduce((sum, i) => sum + (i.priceEstimate ?? 0), 0)} total`
                : section.supplyKind
                  ? `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'} · ${low} low`
                  : `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'}`

              return (
                <div key={section.key} className="inv-sub-dropdown">
                  <button
                    type="button"
                    className="inv-sub-header"
                    onClick={() => toggleSection(section.key)}
                  >
                    <div className="inv-dropdown-header-left">
                      <span className="inv-dropdown-icon inv-dropdown-icon--sm" style={{ background: section.iconBg }}>
                        <Icon size={16} weight="duotone" color={section.iconColor} />
                      </span>
                      <div>
                        <div className="inv-sub-title">{section.title}</div>
                        <div className="inv-dropdown-subtitle">{subtitle}</div>
                      </div>
                    </div>
                    <span className={`inv-chevron${isOpen ? ' inv-chevron--open' : ''}`}>
                      <CaretDown size={12} weight="bold" color="var(--text-dim)" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="inv-sub-body">
                      {section.isWishlist &&
                        wishlist.map((item, index) => (
                          <WishlistRow
                            key={item.id}
                            item={item}
                            onEdit={() => {
                              setAddingWishlist(false)
                              setEditingWishlist(item)
                            }}
                            showDivider={index < wishlist.length - 1}
                          />
                        ))}

                      {section.isEquipment &&
                        equipment.map((item, index) => (
                          <EquipmentRow
                            key={item.id}
                            item={item}
                            onEdit={() => {
                              setAddingEquipment(false)
                              setEditingEquipment(item)
                              setEquipmentMode('edit')
                            }}
                            showDivider={index < equipment.length - 1}
                          />
                        ))}

                      {section.supplyKind &&
                        (sectionItems as Supply[]).map((item, index) => (
                          <SupplyRow
                            key={item.id}
                            supply={item}
                            onEdit={() => openSupplyEdit(item, section.supplyKind!)}
                            showDivider={index < sectionItems.length - 1}
                          />
                        ))}

                      <button
                        type="button"
                        className="inv-add-row"
                        onClick={() => {
                          if (section.isWishlist) {
                            setEditingWishlist(null)
                            setAddingWishlist(true)
                          } else if (section.isEquipment) {
                            setEditingEquipment(null)
                            setAddingEquipment(true)
                            setEquipmentMode('add')
                          } else if (section.supplyKind) {
                            openSupplyAdd(section.supplyKind)
                          }
                        }}
                      >
                        <span className="inv-add-btn">+</span>
                        <span className="inv-add-label">Add {section.addLabel}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {supplySheetOpen && (
        <SupplyEditSheet
          supply={editingSupply}
          kind={supplyKind}
          mode={supplyMode}
          onModeChange={setSupplyMode}
          onSaveAdd={async (input) => {
            await createSupply(input)
            await reload()
          }}
          onSaveEdit={async (id, input) => {
            const prev = catalog.find((s) => s.id === id)
            const wasLow = prev ? isLowStock(prev) : false
            await updateSupply(id, input)
            const updated = await getSupplies()
            const next = updated.find((s) => s.id === id)
            if (next && isLowStock(next) && !wasLow) notifyLowStock(next.name)
            await reload()
          }}
          onRestock={async (id, quantity, totalCost) => {
            await restockSupply(id, { quantity, total_cost: totalCost || undefined })
            await reload()
          }}
          onDelete={async (id) => {
            await deleteSupply(id)
            await reload()
            setEditingSupply(null)
          }}
          onClose={() => {
            setEditingSupply(null)
            setAddingSupplyKind(null)
          }}
        />
      )}

      {equipmentSheetOpen && (
        <EquipmentEditSheet
          item={editingEquipment}
          mode={equipmentMode}
          onSaveAdd={async (input) => {
            await createEquipment(input)
            await reload()
          }}
          onSaveEdit={async (id, input) => {
            await updateEquipment(id, input)
            await reload()
          }}
          onDelete={async (id) => {
            await deleteEquipment(id)
            await reload()
            setEditingEquipment(null)
          }}
          onClose={() => {
            setEditingEquipment(null)
            setAddingEquipment(false)
          }}
        />
      )}

      {wishlistSheetOpen && (
        <InventoryEditSheet
          item={editingWishlist}
          category="wishlist"
          isNew={!editingWishlist}
          onSave={(data) =>
            handleWishlistSave({
              name: data.name,
              notes: data.notes,
              priceEstimate: data.priceEstimate,
            })
          }
          onDelete={() => editingWishlist && handleWishlistDelete(editingWishlist.id)}
          onClose={() => {
            setEditingWishlist(null)
            setAddingWishlist(false)
          }}
        />
      )}
    </section>
  )
}
